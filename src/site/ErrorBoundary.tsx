import { Component, type ReactNode } from 'react';
import { CrashPage } from './BrokenPages';

/** Catches a crash while drawing the page and shows the 500 screen instead of leaving the page blank. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('Page crashed:', error, info.componentStack);
  }
  render() {
    return this.state.error ? <CrashPage error={this.state.error} /> : this.props.children;
  }
}
