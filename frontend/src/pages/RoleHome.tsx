import Sidebar from "../components/Sidebar";
import { getUser } from "../lib/auth";

export default function RoleHome() {
    const user = getUser();
    return(
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8">
                <h1 className="text-2xl font-bold text-ink">
                        {user?.role === "ADMIN" ? "Administrator dashboard" : "Business dashboard"}
                </h1>
                <p className="text-sm text-muted mb-6">Signed in as {user?.email}</p>
                <div className="bg-white border border-border rounded-card p-6 shadow-sm max-w-xl">
                    <p className="text-sm text-ink">
                        {user?.role === 'ADMIN'
                            ? 'Administrator API (user management, business verification, audit log) is available. Its screens are the next build step.'
                            : 'The businesse API (profile, creating and managing opportunities) is available. Its screens are the next build step'}
                    </p>
                </div>
            </main>
        </div>
    );
}