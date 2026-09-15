export default function TechVisual() {
  return <div className="tech-visual" aria-hidden="true">
    <div className="orbit one"/><div className="orbit two"/>
    <div className="core"><div className="core-inner"/></div>
    <i className="node n1"/><i className="node n2"/><i className="node n3"/><i className="node n4"/>
    <div className="code-card top"><b>nova.core</b><br/>security = active<br/>ai_nodes = 128<br/>status = ready</div>
    <div className="code-card bottom"><b>01 / LEARN</b><br/>02 / BUILD<br/>03 / LAUNCH</div>
  </div>;
}
