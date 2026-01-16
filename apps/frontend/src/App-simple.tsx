function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎵 Grooovy App is Working!</h1>
      <p>If you can see this, the React app is rendering correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default App;