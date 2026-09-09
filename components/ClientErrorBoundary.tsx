"use client";

import React from "react";

type Props = { children: React.ReactNode; label?: string };
type State = { failed: boolean; message?: string };

export default class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(error: any): State {
    return { failed: true, message: error?.message || "Erreur côté client" };
  }
  componentDidCatch(error: any, info: any) {
    console.error("PSORE client component error", this.props.label, error, info);
  }
  render() {
    if (this.state.failed) {
      return <div className="notice-empty"><strong>{this.props.label || "Composant"} indisponible.</strong><br/><small>{this.state.message}</small></div>;
    }
    return this.props.children;
  }
}
