import "./globals.css";
import OfflineRegister from "@/components/OfflineRegister";
export const metadata={title:"PSORE V3.0 – Plateforme SIG décisionnelle",description:"PTCS – Enabel – DNH/DRHK"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body><OfflineRegister/>{children}</body></html>}
