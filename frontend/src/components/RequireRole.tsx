import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUser, homePathFor, type SessionUser } from "../lib/auth";

export default function RequireRole({ role }: { role: SessionUser['role'] }) {
    const user = getUser();
    if (!getToken() || !user) return <Navigate to= "/login" replace />;
    if (user.role !== role) return <Navigate to= {homePathFor(user.role)} replace />;
    return <Outlet />
}