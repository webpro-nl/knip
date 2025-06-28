import ExampleQuery from './ExampleQuery.graphql';

function App() {
  return (
    <>
      <h1>Vite + React</h1>
      <pre>
        <code>{JSON.stringify(ExampleQuery, null, 2)}</code>
      </pre>
    </>
  );
}

export default App;
