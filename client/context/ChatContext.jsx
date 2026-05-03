import { createContext, useContext, useEffect, useRef, useState } from "react"
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})

    const { socket, axios } = useContext(AuthContext);

    // Use refs to avoid stale closures in socket handlers
    const selectedUserRef = useRef(null);
    const messageCache = useRef({});

    // Keep ref in sync with state
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser])

    // Get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                const sorted = data.users.sort((a, b) => {
                    const aTime = data.lastMessages?.[a._id] || a.updatedAt || 0
                    const bTime = data.lastMessages?.[b._id] || b.updatedAt || 0
                    return new Date(bTime) - new Date(aTime)
                })
                setUsers(sorted)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Get messages for selected user
    const getMessages = async (userId) => {
        try {
            // Show cached messages instantly
            if (messageCache.current[userId]) {
                setMessages(messageCache.current[userId])
            }
            // Fetch fresh in background
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                messageCache.current[userId] = data.messages
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Send message
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages(prev => [...prev, data.newMessage])
                // Update cache
                if (messageCache.current[selectedUser._id]) {
                    messageCache.current[selectedUser._id] = [...messageCache.current[selectedUser._id], data.newMessage]
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Subscribe to socket messages — only once when socket is ready
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            const currentSelectedUser = selectedUserRef.current;

            if (currentSelectedUser && newMessage.senderId === currentSelectedUser._id) {
                // Message from currently open chat
                newMessage.seen = true;
                setMessages(prev => [...prev, newMessage]);
                // Update cache
                if (messageCache.current[currentSelectedUser._id]) {
                    messageCache.current[currentSelectedUser._id] = [
                        ...messageCache.current[currentSelectedUser._id],
                        newMessage
                    ]
                }
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                // Message from another user — increment unseen
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: prev[newMessage.senderId]
                        ? prev[newMessage.senderId] + 1
                        : 1
                }))
            }
        }

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
        }
    }, [socket]) // Only re-run when socket changes — NOT selectedUser

    const value = {
        messages, users, selectedUser, getUsers,
        getMessages, sendMessage, setSelectedUser,
        unseenMessages, setUnseenMessages
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}