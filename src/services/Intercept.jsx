import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

// 1. The Protected Route Guard
export const ProtectedRoute = () => {
    const token = sessionStorage.getItem("token");
    const clientId = sessionStorage.getItem("clientId");
    const role = sessionStorage.getItem("role");

    // If no token exists, redirect to login immediately
    if (!token || !clientId || !role) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, allow access to nested routes
    return <Outlet />;
};

const AxiosInterceptor = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const resInterceptor = (response) => response;
        const errInterceptor = (error) => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                sessionStorage.clear();
                localStorage.clear();
                navigate('/login', { 
                    state: { message: "Session expired. Please login again." },
                    replace: true 
                });
            }
            return Promise.reject(error);
        };

        const interceptor = api.interceptors.response.use(resInterceptor, errInterceptor);
        return () => api.interceptors.response.eject(interceptor);
    }, [navigate]);

    return children;
};

export default AxiosInterceptor;