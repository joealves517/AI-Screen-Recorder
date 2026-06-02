import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDesc__',
    default_locale: 'en',
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwY9z0CqtogrwOmQkilPqHjZN8/l6/313YIiTInZ/IIx0AYo6rLC4800XWYv5obJAV8UfMMC+IYKZ6qD04kZv42Pic+Xkpyy1OJkKaMKLqQObd4yGnM2vMFXeU8k7zCqxPuA7lgjjBNIwv56FDDJLPmAe/v5pEHGO+LlrDAt+93J6N0zz7O3lj93jTYqKTcd3YJsgUzesOwELXPhug4VKeNCgaPE5r50/OebjLduZD2oKWbk2Utd/rWq1azEB1QiEJ05wyxfU5HBXuO44RVtHed1fEzKL8lECxDyRk8ixn+uq7e/kWep+9kg+sSfUXG3XsGzHJaIJKpMCejpjeYlENQIDAQAB",
    action: {
      default_icon: {
        "16": "assets/img/icon-16.png",
        "32": "assets/img/icon-32.png",
        "48": "assets/img/icon-48.png",
        "128": "assets/img/icon-128.png"
      }
    },
    icons: {
      "16": "assets/img/icon-16.png",
      "32": "assets/img/icon-32.png",
      "48": "assets/img/icon-48.png",
      "128": "assets/img/icon-128.png"
    },
    permissions: [
      'identity',
      'activeTab',
      'storage',
      'unlimitedStorage',
      'downloads',
      'tabs',
      'tabCapture',
      'scripting',
      'system.display'
    ],
    optional_permissions: [
      'offscreen',
      'desktopCapture',
      'alarms',
      'clipboardWrite'
    ],
    host_permissions: ['<all_urls>'],
    oauth2: {
      client_id: '676582412453-th7rc1b54slhajuepvus758pdakvb3t8.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    },
    sandbox: {
      pages: ['editor.html']
    },
    cross_origin_embedder_policy: {
      value: 'require-corp'
    },
    cross_origin_opener_policy: {
      value: 'same-origin'
    },
    content_security_policy: {
      sandbox: "sandbox allow-scripts allow-modals allow-popups; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; object-src 'self'; worker-src 'self' blob: ;",
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; media-src 'self' data: blob: *; img-src 'self' https: data: blob:"
    },
    storage: {
      managed_schema: 'schema.json'
    },
    commands: {
      "start-recording": {
        "suggested_key": { "default": "Alt+Shift+G" },
        "description": "Start recording"
      },
      "cancel-recording": {
        "suggested_key": { "default": "Alt+Shift+X" },
        "description": "Cancel recording"
      },
      "pause-recording": {
        "suggested_key": { "default": "Alt+Shift+M" },
        "description": "Pause/Resume recording"
      },
      "stop-recording": { "description": "Stop recording" },
      "toggle-drawing-mode": { "description": "Toggle drawing mode" },
      "toggle-blur-mode": { "description": "Toggle blur mode" },
      "toggle-hide-ui": { "description": "Toggle hide UI" },
      "toggle-cursor-mode": { "description": "Toggle cursor options" }
    },
    web_accessible_resources: [
      {
        "resources": [
          "assets/*",
          "editor.html",
          "*"
        ],
        "matches": [
          "<all_urls>"
        ]
      }
    ]
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      // Remove sandbox.html from manifest.sandbox.pages so it is a normal page with chrome.* access
      if (manifest.sandbox && Array.isArray(manifest.sandbox.pages)) {
        manifest.sandbox.pages = manifest.sandbox.pages.filter(
          (page) => page !== 'sandbox.html'
        );
        // If no sandbox pages remain, delete the sandbox key to keep it clean
        if (manifest.sandbox.pages.length === 0) {
          delete manifest.sandbox;
        }
      }
    }
  },
  vite: () => ({
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: 'load-js-files-as-jsx',
            setup(build) {
              build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => ({
                loader: 'jsx',
                contents: require('fs').readFileSync(args.path, 'utf8'),
              }))
            }
          }
        ]
      }
    },
    define: {
      'process.env.AISR_APP_BASE': JSON.stringify(''),
      'process.env.AISR_WEBSITE_BASE': JSON.stringify(''),
      'process.env.AISR_ENABLE_CLOUD_FEATURES': JSON.stringify(process.env.AISR_ENABLE_CLOUD_FEATURES || 'true'),
      'process.env.AISR_API_BASE_URL': JSON.stringify(process.env.AISR_API_BASE_URL || 'https://screenity-api-676582412453.us-central1.run.app'),
      'process.env.MAX_RECORDING_DURATION': JSON.stringify(process.env.MAX_RECORDING_DURATION || 3600),
      'process.env.RECORDING_WARNING_THRESHOLD': JSON.stringify(process.env.RECORDING_WARNING_THRESHOLD || 60),
      'process.env.AISR_DEV_MODE': JSON.stringify(process.env.AISR_DEV_MODE || ''),
    }
  })
});
