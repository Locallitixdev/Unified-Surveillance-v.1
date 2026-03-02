import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * React Error Boundary — catches render errors in child components
 * and displays a fallback UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-fallback">
                    <AlertTriangle size={48} />
                    <h2>Something went wrong</h2>
                    <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
