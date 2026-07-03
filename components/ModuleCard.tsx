import Link from "next/link";

export default function ModuleCard({href,icon,title,text}:{href:string;icon:string;title:string;text:string}){
  return <Link className="module-card" href={href} title="Accès réservé aux utilisateurs connectés autorisés">
    <div className="module-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{text}</p>
    <span className="module-lock">🔒 Accès réservé</span>
  </Link>
}
