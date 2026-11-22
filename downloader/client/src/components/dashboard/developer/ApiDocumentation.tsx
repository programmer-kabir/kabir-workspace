import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Code2,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const ApiDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getExtractCode = () => {
    if (activeTab === 'curl') {
      return `curl -X POST https://streamvault.io/api/v1/extract \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_your_api_key_here" \\
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`;
    } else if (activeTab === 'javascript') {
      return `const response = await fetch('https://streamvault.io/api/v1/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_your_api_key_here'
  },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
});

const data = await response.json();
console.log('Video Formats:', data.data.videoFormats);`;
    } else {
      return `import requests

url = "https://streamvault.io/api/v1/extract"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "sk_live_your_api_key_here"
}
payload = {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }
  };

  const getDownloadCode = () => {
    if (activeTab === 'curl') {
      return `curl -X POST https://streamvault.io/api/v1/download \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_your_api_key_here" \\
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "type": "video"}'`;
    } else if (activeTab === 'javascript') {
      return `const response = await fetch('https://streamvault.io/api/v1/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_your_api_key_here'
  },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'video'
  })
});

const result = await response.json();
console.log('Queued Job ID:', result.data.jobId);`;
    } else {
      return `import requests

url = "https://streamvault.io/api/v1/download"
headers = {"X-API-Key": "sk_live_your_api_key_here"}
payload = {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "type": "video"
}

res = requests.post(url, json=payload, headers=headers)
job_id = res.json()["data"]["jobId"]
print(f"Job Queued: {job_id}")`;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      
      {/* Intro Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
        <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FileCode className="w-6 h-6 text-indigo-400" />
          <span>StreamVault REST API Documentation (v1)</span>
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          The StreamVault REST API allows developers to extract media formats, trigger downloads, monitor background queues, and receive real-time webhook callbacks directly in their backends.
        </p>

        {/* Language Tabs */}
        <div className="flex items-center gap-2 pt-4">
          <span className="text-xs text-slate-400 font-semibold mr-2">Language:</span>
          {(['curl', 'javascript', 'python'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveTab(lang)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTab === lang
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Authentication */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h4 className="text-base font-bold text-white">1. Authentication</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Authenticate requests by providing your API key in the <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded">X-API-Key</code> request header or as a Bearer token in the standard <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded">Authorization</code> header:
        </p>
        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
          X-API-Key: sk_live_a1b2c3d4e5f6...
        </pre>
      </div>

      {/* 2. POST /api/v1/extract */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs">
              POST
            </span>
            <span className="text-base font-bold text-white">/api/v1/extract</span>
          </div>
          <button
            onClick={() => copyCode(getExtractCode(), 'extract')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            {copiedIndex === 'extract' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 'extract' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Extracts video title, description, thumbnail, duration, audio bitrate, and all available video formats/resolutions.
        </p>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
          {getExtractCode()}
        </pre>
      </div>

      {/* 3. POST /api/v1/download */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              POST
            </span>
            <span className="text-base font-bold text-white">/api/v1/download</span>
          </div>
          <button
            onClick={() => copyCode(getDownloadCode(), 'download')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            {copiedIndex === 'download' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 'download' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Enqueues a media download into the persistent background worker queue. Returns a persistent <code className="text-indigo-300 bg-slate-950 px-1 rounded">jobId</code>.
        </p>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
          {getDownloadCode()}
        </pre>
      </div>

      {/* 4. Webhook HMAC Verification */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-purple-400" />
          <span>Webhook HMAC-SHA256 Signature Verification</span>
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Every webhook payload sent by StreamVault includes a header <code className="text-indigo-300 bg-slate-950 px-1 rounded">X-StreamVault-Signature: sha256=...</code>. Verify it in your server with your signing secret:
        </p>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(rawPayload, signatureHeader, secret) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}`}
        </pre>
      </div>

      {/* 5. Error Code Reference */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-base font-bold text-white">HTTP Error Status Code Reference</h4>
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Code</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              <tr>
                <td className="p-3 text-emerald-400 font-bold">200 / 201</td>
                <td className="p-3">OK</td>
                <td className="p-3">Request succeeded.</td>
              </tr>
              <tr>
                <td className="p-3 text-amber-400 font-bold">400</td>
                <td className="p-3">INVALID_URL</td>
                <td className="p-3">Malformed URL or missing parameters.</td>
              </tr>
              <tr>
                <td className="p-3 text-rose-400 font-bold">401</td>
                <td className="p-3">API_KEY_MISSING / INVALID_API_KEY</td>
                <td className="p-3">Missing, revoked, or disabled API key.</td>
              </tr>
              <tr>
                <td className="p-3 text-amber-400 font-bold">429</td>
                <td className="p-3">RATE_LIMIT_EXCEEDED</td>
                <td className="p-3">RPM rate limit reached. Inspect Retry-After header.</td>
              </tr>
              <tr>
                <td className="p-3 text-rose-400 font-bold">500</td>
                <td className="p-3">EXTRACTION_ERROR</td>
                <td className="p-3">Target media could not be fetched or is private.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
