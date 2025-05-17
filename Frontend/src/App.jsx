import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:9001');

function App() {
  const [githubUrl, setGithubUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [logs, setLogs] = useState([]);
  const [channel, setChannel] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { githubUrl };
    
    if (slug) payload.Slug = slug;

    try {
      const res = await axios.post('http://localhost:9000/project', payload);
      const { slug: generatedSlug } = res.data.data;
      setChannel(`logs:${generatedSlug}`);
      socket.emit('subscribe', `logs:${generatedSlug}`);
    } catch (err) {
      alert(`Failed to queue project ${err}`);
    }
  };

  useEffect(() => {
  const handler = (msg) => setLogs((prev) => [...prev, msg]);
  socket.on('message', handler);
  return () => socket.off('message', handler);
}, []);

  return (
    <div className="p-6 max-w-xl mx-auto" style={{width: '100vw', textAlign : 'center', marginTop: '20vh'}}>
      <h1 className="text-2xl font-bold mb-4">React Project Builder</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="GitHub Repository URL"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          required
          className="border p-2 w-full"
          style={{margin:'10px'}}
        />
        <input
          type="text"
          placeholder="Optional Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="border p-2 w-full"
          style={{margin:'10px'}}

        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Deploy
        </button>
      </form>

      <div className="mt-6 bg-black text-green-400 p-4 h-60 overflow-y-scroll">
        <h2 className="text-white mb-2">Logs:</h2>
        {logs.map((log, idx) => (
          <pre key={idx} className="whitespace-pre-wrap">{log}</pre>
        ))}
      </div>
    </div>
  );
}

export default App;
