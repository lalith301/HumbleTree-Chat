import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';

const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser,
        unseenMessages, setUnseenMessages, lastMessages } = useContext(ChatContext);
    const { logout, onlineUsers, authUser } = useContext(AuthContext)
    const [input, setInput] = useState('')
    const navigate = useNavigate();

    // Filter users based on search input
    const filteredUsers = input
        ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
        : users;

    // Fetch users once on mount
useEffect(() => {
    getUsers();
}, [])



    // Format timestamp for last message
    const formatTime = (date) => {
        if (!date) return ''
        const d = new Date(date)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        const isYesterday = d.toDateString() === yesterday.toDateString()
        if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (isYesterday) return 'Yesterday'
        return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
    }

    return (
        <div className={`bg-[#111b21] h-full flex flex-col border-r border-[#2a3942] ${selectedUser ? "max-md:hidden" : ''}`}>

            {/* ------- Header ------- */}
            <div className='flex justify-between items-center px-4 py-3 bg-[#202c33] min-h-[59px]'>
                <div className='flex items-center gap-3'>
                    <img
                        src={authUser?.profilePic || assets.avatar_icon}
                        alt=""
                        className='w-10 h-10 rounded-full object-cover cursor-pointer'
                        onClick={() => navigate('/profile')}
                    />
                    <span className='text-white font-medium text-sm'>{authUser?.fullName}</span>
                </div>

                <div className="relative py-2 group">
                    <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
                    <div className='absolute top-full right-0 z-20 w-36 py-2 rounded-md bg-[#233138] shadow-lg hidden group-hover:block'>
                        <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm text-[#e9edef] px-4 py-2 hover:bg-[#2a3942]'>Edit Profile</p>
                        <p onClick={() => logout()} className='cursor-pointer text-sm text-[#e9edef] px-4 py-2 hover:bg-[#2a3942]'>Logout</p>
                    </div>
                </div>
            </div>

            {/* ------- Search ------- */}
            <div className='px-3 py-2 bg-[#111b21]'>
                <div className='bg-[#202c33] rounded-lg flex items-center gap-2 px-4 py-2'>
                    <img src={assets.search_icon} alt="Search" className='w-4 opacity-60' />
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        type="text"
                        className='bg-transparent border-none outline-none text-[#e9edef] text-sm placeholder-[#8696a0] flex-1'
                        placeholder='Search or start new chat'
                    />
                </div>
            </div>

            {/* ------- User List ------- */}
            <div className='flex flex-col overflow-y-scroll flex-1'>
                {filteredUsers.length === 0 && (
                    <div className='flex flex-col items-center justify-center gap-2 mt-16 text-[#8696a0]'>
                        <p className='text-sm'>No users found</p>
                    </div>
                )}

                {filteredUsers.map((user, index) => (
                    <div
                        onClick={() => {
                            setSelectedUser(user)
                            setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }))
                        }}
                        key={index}
                        className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#2a3942]/50 transition-colors
                            ${selectedUser?._id === user._id ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]/50'}`}
                    >
                        {/* Avatar with online dot */}
                        <div className='relative flex-shrink-0'>
                            <img
                                src={user?.profilePic || assets.avatar_icon}
                                alt=""
                                className='w-12 h-12 rounded-full object-cover'
                            />
                            {onlineUsers.includes(user._id) && (
                                <span className='absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]'></span>
                            )}
                        </div>

                        {/* User info */}
                        <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-center mb-0.5'>
                                <p className='text-[#e9edef] font-medium text-sm truncate'>{user.fullName}</p>
                                <span className='text-[#8696a0] text-xs flex-shrink-0 ml-2'>
                                    {formatTime(lastMessages[user._id])}
                                </span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <p className='text-[#8696a0] text-xs truncate'>
                                    {onlineUsers.includes(user._id) ? (
                                        <span className='text-[#00a884]'>Online</span>
                                    ) : (
                                        <span>Offline</span>
                                    )}
                                </p>
                                {/* Unseen message badge */}
                                {unseenMessages[user._id] > 0 && (
                                    <span className='text-xs h-5 w-5 flex justify-center items-center rounded-full bg-[#00a884] text-white font-medium flex-shrink-0'>
                                        {unseenMessages[user._id]}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Sidebar