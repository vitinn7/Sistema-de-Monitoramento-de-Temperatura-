import { AppProvider } from './contexts/AppContext';
import { ErrorBoundary, NetworkStatus } from './components/ui/ErrorDisplay';
import { MainPanel } from './components/MainPanel';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="App">
          <NetworkStatus />
          <MainPanel />
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
