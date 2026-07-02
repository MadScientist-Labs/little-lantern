#!/usr/bin/env python3
"""
Little Lantern
Double-click this file (or run it) to start the frontend.
Then open http://127.0.0.1:3000 in your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
import re
from html.parser import HTMLParser

PORT = 3000
HOST = '127.0.0.1'
ALLOWED_ORIGINS = {
    f'http://localhost:{PORT}',
    f'http://127.0.0.1:{PORT}',
}

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

SYSTEM_PROMPTS_DIR = 'system-prompts'
VOICE_EXAMPLES_DIR = 'voice-examples'

# Image generation provider (Banana Studio / imgeditor.co).
NANO_IMAGE_URL = 'https://imgeditor.co/api'
NANO_IMAGE_MODEL = 'gpt-image-2'

# Tool execution limits
URL_FETCH_MAX_BYTES = 2_000_000   # 2 MB per URL
URL_FETCH_TEXT_CHARS = 20_000     # truncate extracted text
FILE_READ_MAX_BYTES = 1_000_000   # 1 MB per file
FILE_WRITE_MAX_BYTES = 1_000_000  # 1 MB per write
FILE_SEARCH_MAX_MATCHES = 20      # cap total matches returned
FILE_SEARCH_MAX_FILE_BYTES = 2_000_000  # skip files bigger than this
FILE_SEARCH_CONTEXT_LINES = 10    # lines of context around non-markdown matches
FILE_SEARCH_TEXT_EXTS = {
    '.md', '.txt', '.json', '.log', '.csv', '.yml', '.yaml', '.toml', '.ini',
    '.html', '.css', '.js', '.ts', '.py', '.sh', '.bash', '.xml', '.rtf',
}


class _HtmlTextExtractor(HTMLParser):
    """Strip tags, script, and style from HTML; collapse whitespace."""
    def __init__(self):
        super().__init__()
        self._chunks = []
        self._skip = 0
        self._title_parts = []
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'):
            self._skip += 1
        elif tag == 'title':
            self._in_title = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript') and self._skip > 0:
            self._skip -= 1
        elif tag == 'title':
            self._in_title = False
        elif tag in ('p', 'br', 'li', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self._chunks.append('\n')

    def handle_data(self, data):
        if self._skip:
            return
        if self._in_title:
            self._title_parts.append(data)
        else:
            self._chunks.append(data)

    def text(self):
        raw = ''.join(self._chunks)
        raw = re.sub(r'[ \t]+', ' ', raw)
        raw = re.sub(r'\n{3,}', '\n\n', raw)
        return raw.strip()

    def title(self):
        return ''.join(self._title_parts).strip()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that doesn't spam the console"""

    def log_message(self, format, *args):
        # Only log errors
        if args[1] != '200':
            print(f"{args[0]} - {args[1]}")

    def end_headers(self):
        # The app is local-only. Allow same-app browser preflights, but do not
        # expose the tool API to arbitrary websites via wildcard CORS.
        origin = self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        path = urllib.parse.urlsplit(self.path).path
        if path == '/api/system-prompts':
            self.handle_list_system_prompts()
        elif path.startswith('/api/system-prompts/'):
            name = urllib.parse.unquote(path[len('/api/system-prompts/'):])
            self.handle_get_system_prompt(name)
        elif path == '/api/voice-examples':
            self.handle_list_voice_examples()
        elif path.startswith('/api/voice-examples/'):
            name = urllib.parse.unquote(path[len('/api/voice-examples/'):])
            self.handle_get_voice_examples(name)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/system-prompts':
            self.handle_save_system_prompt()
        elif self.path == '/api/voice-examples':
            self.handle_save_voice_examples()
        elif self.path == '/api/tool/web_search':
            self.handle_tool_web_search()
        elif self.path == '/api/tool/url_fetch':
            self.handle_tool_url_fetch()
        elif self.path == '/api/tool/file_read':
            self.handle_tool_file_read()
        elif self.path == '/api/tool/file_search':
            self.handle_tool_file_search()
        elif self.path == '/api/tool/file_write':
            self.handle_tool_file_write()
        elif self.path == '/api/tool/image_generate':
            self.handle_tool_image_generate()
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        path = urllib.parse.urlsplit(self.path).path
        if path.startswith('/api/system-prompts/'):
            name = urllib.parse.unquote(path[len('/api/system-prompts/'):])
            self.handle_delete_system_prompt(name)
        else:
            self.send_response(404)
            self.end_headers()

    def handle_list_voice_examples(self):
        """Return sorted list of .txt filenames (without extension) from voice-examples/"""
        items = []
        if os.path.isdir(VOICE_EXAMPLES_DIR):
            for f in sorted(os.listdir(VOICE_EXAMPLES_DIR)):
                if f.endswith('.txt'):
                    items.append(f[:-4])
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(items).encode('utf-8'))

    def handle_get_voice_examples(self, name):
        """Return content of a specific voice-examples .txt file"""
        safe_name = os.path.basename(name)
        if not safe_name.endswith('.txt'):
            safe_name += '.txt'
        filepath = os.path.join(VOICE_EXAMPLES_DIR, safe_name)
        if os.path.isfile(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'name': safe_name[:-4], 'content': content}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

    def handle_list_system_prompts(self):
        """Return sorted list of .txt filenames (without extension) from system-prompts/"""
        prompts = []
        if os.path.isdir(SYSTEM_PROMPTS_DIR):
            for f in sorted(os.listdir(SYSTEM_PROMPTS_DIR)):
                if f.endswith('.txt'):
                    prompts.append(f[:-4])

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(prompts).encode('utf-8'))

    def handle_get_system_prompt(self, name):
        """Return content of a specific system prompt .txt file"""
        safe_name = os.path.basename(name)
        if not safe_name.endswith('.txt'):
            safe_name += '.txt'

        filepath = os.path.join(SYSTEM_PROMPTS_DIR, safe_name)

        if os.path.isfile(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'name': safe_name[:-4], 'content': content}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'File not found'}).encode('utf-8'))

    def handle_save_system_prompt(self):
        """Save or update a system prompt .txt file"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode('utf-8'))
            return

        name = data.get('name', '').strip()
        content = data.get('content', '')
        if not name:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Name is required'}).encode('utf-8'))
            return

        # Sanitize filename — alphanumeric, spaces, hyphens, underscores only
        safe_name = ''.join(c for c in name if c.isalnum() or c in ' -_').strip()
        if not safe_name:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid name'}).encode('utf-8'))
            return

        filepath = os.path.join(SYSTEM_PROMPTS_DIR, safe_name + '.txt')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'name': safe_name, 'saved': True}).encode('utf-8'))

    def handle_save_voice_examples(self):
        """Save or update a voice-examples .txt file (used by the upload button)."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return self._send_json(400, {'error': 'Invalid JSON'})

        name = (data.get('name') or '').strip()
        content = data.get('content', '')
        if not name:
            return self._send_json(400, {'error': 'Name is required'})

        safe_name = ''.join(c for c in name if c.isalnum() or c in ' -_').strip()
        if not safe_name:
            return self._send_json(400, {'error': 'Invalid name'})

        if not os.path.isdir(VOICE_EXAMPLES_DIR):
            os.makedirs(VOICE_EXAMPLES_DIR, exist_ok=True)
        filepath = os.path.join(VOICE_EXAMPLES_DIR, safe_name + '.txt')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return self._send_json(200, {'name': safe_name, 'saved': True})

    def handle_delete_system_prompt(self, name):
        """Delete a system prompt .txt file"""
        safe_name = os.path.basename(name)
        if not safe_name.endswith('.txt'):
            safe_name += '.txt'

        filepath = os.path.join(SYSTEM_PROMPTS_DIR, safe_name)

        if os.path.isfile(filepath):
            os.remove(filepath)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'deleted': True}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'File not found'}).encode('utf-8'))

    def _read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def handle_tool_web_search(self):
        """Proxy Brave Search. Body: {api_key, query, count?}"""
        data = self._read_json_body()
        if data is None:
            return self._send_json(400, {'error': 'Invalid JSON'})

        api_key = (data.get('api_key') or '').strip()
        query = (data.get('query') or '').strip()
        count = int(data.get('count') or 5)
        count = max(1, min(count, 10))

        if not api_key:
            return self._send_json(400, {'error': 'Brave API key missing. Set it in Settings.'})
        if not query:
            return self._send_json(400, {'error': 'Query is required'})

        url = 'https://api.search.brave.com/res/v1/web/search?' + urllib.parse.urlencode({
            'q': query,
            'count': count,
        })
        req = urllib.request.Request(url, headers={
            'Accept': 'application/json',
            'X-Subscription-Token': api_key,
        })

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = resp.read().decode('utf-8', errors='replace')
                payload = json.loads(body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace') if e.fp else ''
            return self._send_json(e.code, {'error': f'Brave API {e.code}', 'body': err_body[:500]})
        except urllib.error.URLError as e:
            return self._send_json(502, {'error': f'Network error: {e.reason}'})
        except Exception as e:
            return self._send_json(500, {'error': str(e)})

        results = []
        web = (payload.get('web') or {}).get('results') or []
        for r in web[:count]:
            results.append({
                'title': r.get('title', ''),
                'url': r.get('url', ''),
                'description': r.get('description', ''),
            })

        return self._send_json(200, {'query': query, 'results': results})

    def handle_tool_url_fetch(self):
        """Fetch URL, return extracted text. Body: {url}"""
        data = self._read_json_body()
        if data is None:
            return self._send_json(400, {'error': 'Invalid JSON'})

        url = (data.get('url') or '').strip()
        if not url:
            return self._send_json(400, {'error': 'URL is required'})
        if not (url.startswith('http://') or url.startswith('https://')):
            return self._send_json(400, {'error': 'URL must start with http:// or https://'})

        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; LittleLantern-Frontend/1.0)',
            'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
        })

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                content_type = resp.headers.get('Content-Type', '').lower()
                raw = resp.read(URL_FETCH_MAX_BYTES + 1)
                truncated_bytes = len(raw) > URL_FETCH_MAX_BYTES
                if truncated_bytes:
                    raw = raw[:URL_FETCH_MAX_BYTES]
                charset = 'utf-8'
                if 'charset=' in content_type:
                    charset = content_type.split('charset=', 1)[1].split(';')[0].strip() or 'utf-8'
                try:
                    body = raw.decode(charset, errors='replace')
                except LookupError:
                    body = raw.decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            return self._send_json(e.code, {'error': f'HTTP {e.code} fetching URL'})
        except urllib.error.URLError as e:
            return self._send_json(502, {'error': f'Network error: {e.reason}'})
        except Exception as e:
            return self._send_json(500, {'error': str(e)})

        title = ''
        if 'html' in content_type or body.lstrip().startswith('<'):
            extractor = _HtmlTextExtractor()
            try:
                extractor.feed(body)
            except Exception:
                pass
            text = extractor.text()
            title = extractor.title()
        else:
            text = re.sub(r'\n{3,}', '\n\n', body).strip()

        truncated_text = False
        if len(text) > URL_FETCH_TEXT_CHARS:
            text = text[:URL_FETCH_TEXT_CHARS]
            truncated_text = True

        return self._send_json(200, {
            'url': url,
            'title': title,
            'content_type': content_type,
            'text': text,
            'truncated': truncated_bytes or truncated_text,
        })

    def handle_tool_file_read(self):
        """Read file from a user-configured working directory. Body: {working_dir, path}"""
        data = self._read_json_body()
        if data is None:
            return self._send_json(400, {'error': 'Invalid JSON'})

        working_dir = (data.get('working_dir') or '').strip()
        rel_path = (data.get('path') or '').strip()

        if not working_dir:
            return self._send_json(400, {'error': 'Working directory not configured. Set it in Settings.'})
        if not rel_path:
            return self._send_json(400, {'error': 'Path is required'})

        if not os.path.isdir(working_dir):
            return self._send_json(400, {'error': f'Working directory does not exist: {working_dir}'})

        # Resolve to absolute, then verify it stays inside working_dir
        base_abs = os.path.realpath(working_dir)
        target_abs = os.path.realpath(os.path.join(base_abs, rel_path))
        try:
            common = os.path.commonpath([base_abs, target_abs])
        except ValueError:
            return self._send_json(400, {'error': 'Path escapes working directory'})
        if common != base_abs:
            return self._send_json(400, {'error': 'Path escapes working directory'})

        if not os.path.isfile(target_abs):
            return self._send_json(404, {'error': 'File not found'})

        try:
            size = os.path.getsize(target_abs)
            with open(target_abs, 'rb') as f:
                raw = f.read(FILE_READ_MAX_BYTES + 1)
            truncated = len(raw) > FILE_READ_MAX_BYTES
            if truncated:
                raw = raw[:FILE_READ_MAX_BYTES]
            try:
                content = raw.decode('utf-8')
            except UnicodeDecodeError:
                content = raw.decode('utf-8', errors='replace')
        except Exception as e:
            return self._send_json(500, {'error': str(e)})

        return self._send_json(200, {
            'path': rel_path,
            'size': size,
            'content': content,
            'truncated': truncated,
        })

    def handle_tool_file_write(self):
        """Create or overwrite a text file inside the user-configured working directory.
        Body: {working_dir, path, content}. Same escape guard as file_read — the
        resolved target must stay inside the working directory."""
        data = self._read_json_body()
        if data is None:
            return self._send_json(400, {'error': 'Invalid JSON'})

        working_dir = (data.get('working_dir') or '').strip()
        rel_path = (data.get('path') or '').strip()
        content = data.get('content')
        if content is None:
            content = ''

        if not working_dir:
            return self._send_json(400, {'error': 'Working directory not configured. Set it in Settings.'})
        if not rel_path:
            return self._send_json(400, {'error': 'Path is required'})
        if not isinstance(content, str):
            return self._send_json(400, {'error': 'content must be a string'})
        if len(content.encode('utf-8')) > FILE_WRITE_MAX_BYTES:
            return self._send_json(400, {'error': f'Content too large (max {FILE_WRITE_MAX_BYTES} bytes)'})

        if not os.path.isdir(working_dir):
            return self._send_json(400, {'error': f'Working directory does not exist: {working_dir}'})

        # Resolve to absolute, then verify it stays inside working_dir
        base_abs = os.path.realpath(working_dir)
        target_abs = os.path.realpath(os.path.join(base_abs, rel_path))
        try:
            common = os.path.commonpath([base_abs, target_abs])
        except ValueError:
            return self._send_json(400, {'error': 'Path escapes working directory'})
        if common != base_abs:
            return self._send_json(400, {'error': 'Path escapes working directory'})
        if os.path.isdir(target_abs):
            return self._send_json(400, {'error': 'Path is a directory, not a file'})

        existed = os.path.isfile(target_abs)
        try:
            parent = os.path.dirname(target_abs)
            if parent and not os.path.isdir(parent):
                os.makedirs(parent, exist_ok=True)
            with open(target_abs, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
        except Exception as e:
            return self._send_json(500, {'error': str(e)})

        return self._send_json(200, {
            'path': rel_path,
            'bytes_written': len(content.encode('utf-8')),
            'created': not existed,
        })

    def handle_tool_file_search(self):
        """Search text files under working_dir for any of the given terms (OR).

        Body: {working_dir, terms: [str,...], path?: str}
        - For .md files, returns the full section under the nearest header.
        - For other text files, returns a window of ~10 lines around the match.
        - Case-insensitive substring match. Caps total matches.
        """
        data = self._read_json_body()
        if data is None:
            return self._send_json(400, {'error': 'Invalid JSON'})

        working_dir = (data.get('working_dir') or '').strip()
        terms = data.get('terms') or []
        scope = (data.get('path') or '').strip()

        if not working_dir:
            return self._send_json(400, {'error': 'Working directory not configured. Set it in Settings.'})
        if not isinstance(terms, list) or not terms:
            return self._send_json(400, {'error': 'terms must be a non-empty array of strings'})
        terms = [str(t).strip() for t in terms if str(t).strip()]
        if not terms:
            return self._send_json(400, {'error': 'terms must contain at least one non-empty string'})
        if not os.path.isdir(working_dir):
            return self._send_json(400, {'error': f'Working directory does not exist: {working_dir}'})

        base_abs = os.path.realpath(working_dir)
        if scope:
            scope_abs = os.path.realpath(os.path.join(base_abs, scope))
            try:
                common = os.path.commonpath([base_abs, scope_abs])
            except ValueError:
                return self._send_json(400, {'error': 'Path escapes working directory'})
            if common != base_abs:
                return self._send_json(400, {'error': 'Path escapes working directory'})
            start_path = scope_abs
        else:
            start_path = base_abs

        # Collect candidate files
        files_to_scan = []
        if os.path.isfile(start_path):
            files_to_scan.append(start_path)
        else:
            for root, dirs, files in os.walk(start_path):
                # Skip common noise
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', '__pycache__')]
                for f in files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in FILE_SEARCH_TEXT_EXTS:
                        files_to_scan.append(os.path.join(root, f))

        terms_lower = [t.lower() for t in terms]
        matches = []
        files_scanned = 0
        total_found = 0
        truncated = False

        for fpath in files_to_scan:
            if len(matches) >= FILE_SEARCH_MAX_MATCHES:
                truncated = True
                break
            try:
                if os.path.getsize(fpath) > FILE_SEARCH_MAX_FILE_BYTES:
                    continue
                with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                    text = f.read()
            except Exception:
                continue
            files_scanned += 1

            rel = os.path.relpath(fpath, base_abs).replace('\\', '/')
            is_md = fpath.lower().endswith('.md')
            lines = text.split('\n')
            lower_lines = [ln.lower() for ln in lines]

            # Find which lines have any term
            hit_lines = []
            for i, ll in enumerate(lower_lines):
                matched_term = next((t for t, tl in zip(terms, terms_lower) if tl in ll), None)
                if matched_term is not None:
                    hit_lines.append((i, matched_term))

            if not hit_lines:
                continue
            total_found += len(hit_lines)

            # Deduplicate hits by section (md) or by overlapping window (other)
            if is_md:
                used_sections = set()
                for line_idx, term in hit_lines:
                    sec_start, sec_end, header = _md_section_bounds(lines, line_idx)
                    key = (sec_start, sec_end)
                    if key in used_sections:
                        continue
                    used_sections.add(key)
                    content = '\n'.join(lines[sec_start:sec_end]).strip()
                    matches.append({
                        'file': rel,
                        'line': line_idx + 1,
                        'section': header,
                        'term': term,
                        'content': content,
                    })
                    if len(matches) >= FILE_SEARCH_MAX_MATCHES:
                        truncated = True
                        break
            else:
                used_windows = []
                for line_idx, term in hit_lines:
                    win_start = max(0, line_idx - FILE_SEARCH_CONTEXT_LINES)
                    win_end = min(len(lines), line_idx + FILE_SEARCH_CONTEXT_LINES + 1)
                    # Skip if overlaps a prior window
                    if any(win_start < e and win_end > s for s, e in used_windows):
                        continue
                    used_windows.append((win_start, win_end))
                    content = '\n'.join(lines[win_start:win_end]).strip()
                    matches.append({
                        'file': rel,
                        'line': line_idx + 1,
                        'section': None,
                        'term': term,
                        'content': content,
                    })
                    if len(matches) >= FILE_SEARCH_MAX_MATCHES:
                        truncated = True
                        break

        return self._send_json(200, {
            'terms': terms,
            'files_scanned': files_scanned,
            'total_hits': total_found,
            'matches': matches,
            'truncated': truncated,
        })

    def handle_tool_image_generate(self):
        """Proxy Banana Studio / imgeditor.co image generation.
        Body: {apiKey, prompt, aspect_ratio?, resolution?, quality?, output_format?}
        Returns: {image_url, prompt}
        """
        data = self._read_json_body()
        if data is None:
            return self._send_json(400, {'error': 'Invalid JSON'})

        api_key = (data.get('apiKey') or '').strip()
        prompt = (data.get('prompt') or '').strip()
        aspect_ratio = (data.get('aspect_ratio') or '1:1').strip()
        # Cost controls are forced here on purpose and intentionally ignore whatever the
        # model or caller requested: cheapest tier, standard quality, and JPEG (smaller
        # files than PNG). To allow higher-resolution output, change these by hand.
        resolution = '1K'
        quality = 'standard'
        output_format = 'jpeg'

        if not api_key:
            return self._send_json(400, {'error': 'Missing Banana Studio API key'})
        if not prompt:
            return self._send_json(400, {'error': 'Prompt is required'})

        submit_payload = json.dumps({
            'model': NANO_IMAGE_MODEL,
            'prompt': prompt,
            'aspect_ratio': aspect_ratio,
            'resolution': resolution,
            'quality': quality,
            'output_format': output_format,
        }).encode('utf-8')

        auth_headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        }

        def _provider_error(code, parsed_or_none, err_body_or_none):
            provider_msg = ''
            if isinstance(parsed_or_none, dict):
                oe = parsed_or_none.get('error')
                if isinstance(oe, dict):
                    provider_msg = oe.get('message') or oe.get('code') or oe.get('type') or ''
                elif isinstance(oe, str):
                    provider_msg = oe
                if not provider_msg:
                    provider_msg = parsed_or_none.get('message') or ''
            error_str = f'Banana Studio API {code}: {provider_msg}' if provider_msg else f'Banana Studio API {code}'
            return self._send_json(code, {
                'error': error_str,
                'status': code,
                'provider_error': parsed_or_none if parsed_or_none is not None else None,
                'raw': (err_body_or_none[:1000] if err_body_or_none and parsed_or_none is None else None),
            })

        # 1. Submit generation request to obtain task_id.
        submit_req = urllib.request.Request(
            f'{NANO_IMAGE_URL}/v1/images/generate',
            data=submit_payload,
            headers=auth_headers,
            method='POST',
        )

        try:
            with urllib.request.urlopen(submit_req, timeout=30) as resp:
                submit_body = resp.read().decode('utf-8', errors='replace')
                submit_out = json.loads(submit_body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace') if e.fp else ''
            try:
                parsed = json.loads(err_body)
            except Exception:
                parsed = None
            return _provider_error(e.code, parsed, err_body)
        except urllib.error.URLError as e:
            return self._send_json(502, {'error': f'Network error: {e.reason}'})
        except Exception as e:
            return self._send_json(500, {'error': str(e)})

        task_id = ''
        if isinstance(submit_out, dict):
            d = submit_out.get('data')
            if isinstance(d, dict):
                task_id = d.get('task_id') or ''
        if not task_id:
            return self._send_json(502, {
                'error': 'Image provider returned no task_id',
                'provider_response': submit_out,
            })

        # 2-3. Poll status until completed / failed / timeout.
        import time
        poll_interval = 2.0
        poll_deadline = time.monotonic() + 180.0  # 3 minutes total
        status_url = f'{NANO_IMAGE_URL}/v1/images/status?task_id={urllib.parse.quote(task_id)}'

        while True:
            if time.monotonic() > poll_deadline:
                return self._send_json(504, {
                    'error': 'Banana Studio image generation timed out',
                    'task_id': task_id,
                })

            status_req = urllib.request.Request(
                status_url,
                headers=auth_headers,
                method='GET',
            )

            try:
                with urllib.request.urlopen(status_req, timeout=30) as resp:
                    status_body = resp.read().decode('utf-8', errors='replace')
                    status_out = json.loads(status_body)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='replace') if e.fp else ''
                try:
                    parsed = json.loads(err_body)
                except Exception:
                    parsed = None
                return _provider_error(e.code, parsed, err_body)
            except urllib.error.URLError as e:
                return self._send_json(502, {'error': f'Network error: {e.reason}'})
            except Exception as e:
                return self._send_json(500, {'error': str(e)})

            d = status_out.get('data') if isinstance(status_out, dict) else None
            status_val = d.get('status') if isinstance(d, dict) else None

            if status_val == 'completed':
                # 4. Return image_url from data.
                image_url = d.get('image_url') or ''
                if not image_url:
                    return self._send_json(502, {
                        'error': 'Image provider marked task completed but returned no image_url',
                        'provider_response': status_out,
                    })
                return self._send_json(200, {'image_url': image_url, 'prompt': prompt})

            if status_val in ('failed', 'error', 'cancelled'):
                fail_msg = (d.get('error') if isinstance(d, dict) else None) or status_val
                return self._send_json(502, {
                    'error': f'Banana Studio image generation {status_val}: {fail_msg}',
                    'provider_response': status_out,
                })

            time.sleep(poll_interval)


def _md_section_bounds(lines, line_idx):
    """Return (start, end, header_text) for the markdown section containing line_idx.
    Section = from the nearest header at or above this line down to the next header
    of equal-or-higher level (fewer #). If no header above, returns (0, end).
    """
    header_re = re.compile(r'^(#{1,6})\s+(.*)$')
    # Find nearest header at or above
    sec_start = 0
    header_level = None
    header_text = None
    for i in range(line_idx, -1, -1):
        m = header_re.match(lines[i])
        if m:
            sec_start = i
            header_level = len(m.group(1))
            header_text = m.group(2).strip()
            break
    # Find next header of equal-or-higher level after sec_start
    sec_end = len(lines)
    if header_level is not None:
        for j in range(sec_start + 1, len(lines)):
            m = header_re.match(lines[j])
            if m and len(m.group(1)) <= header_level:
                sec_end = j
                break
    return sec_start, sec_end, header_text

def main():
    # Ensure system-prompts folder exists
    os.makedirs(SYSTEM_PROMPTS_DIR, exist_ok=True)

    print(f"""
╔══════════════════════════════════════════════════╗
║                  Little Lantern                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║   Server running at: http://127.0.0.1:{PORT}      ║
║                                                  ║
║   Press Ctrl+C to stop the server                ║
║                                                  ║
╚══════════════════════════════════════════════════╝
""")

    try:
        with socketserver.TCPServer((HOST, PORT), QuietHandler) as httpd:
            # Open browser
            webbrowser.open(f'http://{HOST}:{PORT}')

            # Serve forever
            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\nPort {PORT} is already in use.")
            print(f"Either close the other application or change PORT in this script.")
        else:
            raise

if __name__ == '__main__':
    main()
