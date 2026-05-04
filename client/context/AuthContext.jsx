import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import { io } from "socket.io-client"

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error) {
            console.log(error.message)
        } finally {
            setIsCheckingAuth(false)
        }
    }

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["authorization"] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token", data.token)
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["authorization"] = null;
        toast.success("Logged out successfully")
        socket?.disconnect();
        setSocket(null);
    }

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const firebaseLogin = async (firebaseToken, fullName, profilePic, bio) => {
        try {
            const { data } = await axios.post("/api/auth/firebase", {
                firebaseToken,
                fullName,
                profilePic,
                bio
            });
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["authorization"] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const connectSocket = (userData) => {
        if (!userData) return;

        // Create socket only if none exists
        setSocket(prev => {
            if (prev?.connected) return prev;
            if (prev) prev.disconnect();

            const newSocket = io(backendUrl, {
                query: { userId: userData._id },
                transports: ['polling', 'websocket'], // polling first, then upgrade
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
            });

            newSocket.on("getOnlineUsers", (userIds) => {
                setOnlineUsers(userIds.map(id => id.toString()))
            })

            return newSocket;
        })
    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["authorization"] = `Bearer ${token}`;
            checkAuth();
        } else {
            setIsCheckingAuth(false)  // ADD THIS
        }
    }, [])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        firebaseLogin,
        isCheckingAuth
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}