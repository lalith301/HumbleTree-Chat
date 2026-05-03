import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const RightSidebar = () => {
    const { selectedUser, messages } = useContext(ChatContext)
    const { logout, onlineUsers } = useContext(AuthContext)
    const [msgImages, setMsgImages] = useState([])

    // Get all images from messages
    useEffect(() => {
        setMsgImages(
            messages.filter(msg => msg.image).map(msg => msg.image)
        )
    }, [messages])

    return selectedUser && (
        <div className='bg-[#111b21] text-white w-full flex flex-col overflow-y-scroll border-l border-[#2a3942] max-md:hidden'>

            {/* ------- Profile Section ------- */}
            <div className='flex flex-col items-center gap-3 py-8 px-6 bg-[#202c33] border-b border-[#2a3942]'>
                <img
                    src={selectedUser?.profilePic || assets.avatar_icon}
                    alt=""
                    className='w-24 h-24 rounded-full object-cover border-2 border-[#2a3942]'
                />
                <div className='text-center'>
                    <h1 className='text-[#e9edef] text-lg font-medium flex items-center justify-center gap-2'>
                        {onlineUsers.includes(selectedUser._id) && (
                            <span className='w-2 h-2 rounded-full bg-[#00a884]'></span>
                        )}
                        {selectedUser.fullName}
                    </h1>
                    <p className='text-[#8696a0] text-sm mt-1'>
                        {onlineUsers.includes(selectedUser._id) ? (
                            <span className='text-[#00a884]'>Online</span>
                        ) : 'Offline'}
                    </p>
                </div>
            </div>

            {/* ------- Bio Section ------- */}
            <div className='px-6 py-4 border-b border-[#2a3942]'>
                <p className='text-[#8696a0] text-xs uppercase tracking-wider mb-2'>About</p>
                <p className='text-[#e9edef] text-sm'>{selectedUser.bio || 'Hey there! I am using HumbleTree.'}</p>
            </div>

            {/* ------- Media Section ------- */}
            <div className='px-6 py-4 flex-1'>
                <p className='text-[#8696a0] text-xs uppercase tracking-wider mb-3'>
                    Media ({msgImages.length})
                </p>
                {msgImages.length === 0 ? (
                    <p className='text-[#3b4a54] text-sm'>No media shared yet</p>
                ) : (
                    <div className='grid grid-cols-2 gap-2 max-h-[300px] overflow-y-scroll'>
                        {msgImages.map((url, index) => (
                            <div
                                key={index}
                                onClick={() => window.open(url)}
                                className='cursor-pointer rounded-lg overflow-hidden aspect-square'
                            >
                                <img
                                    src={url}
                                    alt=""
                                    className='w-full h-full object-cover hover:opacity-80 transition-opacity'
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ------- Logout Button ------- */}
            <div className='px-6 py-4 border-t border-[#2a3942]'>
                <button
                    onClick={() => logout()}
                    className='w-full py-2.5 bg-[#202c33] text-[#ea4335] text-sm font-medium rounded-lg hover:bg-[#2a3942] transition-colors border border-[#2a3942]'
                >
                    Log out
                </button>
            </div>

        </div>
    )
}

export default RightSidebar