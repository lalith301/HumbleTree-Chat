import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

const ChatContainer = () => {
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext)
    const { authUser, onlineUsers } = useContext(AuthContext)

    const scrollEnd = useRef()
    const [input, setInput] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)
    const [previewImage, setPreviewImage] = useState(null)
    const [previewFile, setPreviewFile] = useState(null)
    const [fullscreenImage, setFullscreenImage] = useState(null)
    const [sending, setSending] = useState(false)

    // Handle sending a text message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "" || sending) return null;
        setSending(true)
        await sendMessage({ text: input.trim() });
        setInput("")
        setShowEmoji(false)
        setSending(false)
    }

    // Handle image file selection — show preview
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file")
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result)
            setPreviewFile(file)
        }
        reader.readAsDataURL(file)
        e.target.value = ""
    }

    // Handle sending the previewed image
    const handleSendImage = async () => {
        if (!previewImage || sending) return;
        setSending(true)
        await sendMessage({ image: previewImage })
        setPreviewImage(null)
        setPreviewFile(null)
        setSending(false)
    }

    // Handle emoji selection
    const handleEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji)
    }

    // Group messages by date
    const groupMessagesByDate = (msgs) => {
        const groups = {}
        msgs.forEach(msg => {
            const date = new Date(msg.createdAt).toDateString()
            if (!groups[date]) groups[date] = []
            groups[date].push(msg)
        })
        return groups
    }

    // Format date label for separator
    const formatDateLabel = (dateStr) => {
        const d = new Date(dateStr)
        const now = new Date()
        if (d.toDateString() === now.toDateString()) return 'Today'
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
    }

    // Message status tick component
    const MessageTicks = ({ msg }) => {
        if (msg.senderId !== authUser._id) return null
        if (msg.seen) {
            // Blue double tick
            return (
                <span className='ml-1 inline-flex'>
                    <svg viewBox="0 0 16 15" width="16" height="15" fill="#53bdeb">
                        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                    </svg>
                </span>
            )
        }
        // Grey double tick (delivered)
        return (
            <span className='ml-1 inline-flex'>
                <svg viewBox="0 0 16 15" width="16" height="15" fill="#8696a0">
                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                </svg>
            </span>
        )
    }

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const groupedMessages = groupMessagesByDate(messages)

    return selectedUser ? (
        <div className='h-full flex flex-col relative bg-[#0b141a] min-h-0'>

            {/* ------- Header ------- */}
            <div className='flex items-center gap-3 px-4 py-3 bg-[#202c33] border-b border-[#2a3942] min-h-[59px]'>
                <div className='relative'>
                    <img
                        src={selectedUser.profilePic || assets.avatar_icon}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    {onlineUsers.includes(selectedUser._id) && (
                        <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#202c33]'></span>
                    )}
                </div>
                <div className='flex-1'>
                    <p className='text-[#e9edef] font-medium text-sm'>{selectedUser.fullName}</p>
                    <p className='text-[#8696a0] text-xs'>
                        {onlineUsers.includes(selectedUser._id) ? (
                            <span className='text-[#00a884]'>online</span>
                        ) : 'offline'}
                    </p>
                </div>
                <img
                    onClick={() => setSelectedUser(null)}
                    src={assets.arrow_icon}
                    alt=""
                    className='md:hidden max-w-7 cursor-pointer'
                />
                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5 opacity-60' />
            </div>

            {/* ------- Chat Area ------- */}
            <div
                className='flex-1 overflow-y-auto p-4 pb-2 min-h-0'
                style={{ backgroundImage: 'radial-gradient(#1e2d35 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                onClick={() => setShowEmoji(false)}
            >
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        {/* Date separator */}
                        <div className='flex justify-center my-4'>
                            <span className='bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg border border-[#2a3942]'>
                                {formatDateLabel(date)}
                            </span>
                        </div>

                        {msgs.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex mb-1 ${msg.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[65%] px-3 py-2 rounded-lg relative
                                        ${msg.senderId === authUser._id
                                            ? 'bg-[#005c4b] rounded-tr-none'
                                            : 'bg-[#202c33] rounded-tl-none'
                                        }`}
                                >
                                    {/* Image message */}
                                    {msg.image ? (
                                        <img
                                            src={msg.image}
                                            alt=""
                                            className='max-w-[230px] rounded-md cursor-pointer'
                                            onClick={() => setFullscreenImage(msg.image)}
                                        />
                                    ) : (
                                        <p className='text-[#e9edef] text-sm break-words'>{msg.text}</p>
                                    )}

                                    {/* Time and ticks */}
                                    <div className='flex items-center justify-end gap-1 mt-1'>
                                        <span className='text-[#8696a0] text-[10px]'>
                                            {formatMessageTime(msg.createdAt)}
                                        </span>
                                        <MessageTicks msg={msg} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                <div ref={scrollEnd}></div>
            </div>

            {/* ------- Image Preview Modal ------- */}
            {previewImage && (
                <div className='absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4'>
                    <p className='text-white text-sm'>Send this image?</p>
                    <img src={previewImage} alt="" className='max-w-sm max-h-64 rounded-lg object-contain' />
                    <div className='flex gap-4'>
                        <button
                            onClick={() => { setPreviewImage(null); setPreviewFile(null) }}
                            className='px-6 py-2 bg-[#202c33] text-white rounded-lg hover:bg-[#2a3942] transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSendImage}
                            className='px-6 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f72] transition-colors'
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* ------- Fullscreen Image View ------- */}
            {fullscreenImage && (
                <div
                    className='absolute inset-0 bg-black/95 z-50 flex items-center justify-center'
                    onClick={() => setFullscreenImage(null)}
                >
                    <img src={fullscreenImage} alt="" className='max-w-full max-h-full object-contain p-4' />
                    <button
                        className='absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center'
                        onClick={() => setFullscreenImage(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ------- Emoji Picker ------- */}
            {showEmoji && (
                <div className='absolute bottom-20 left-4 z-40'>
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme="dark"
                        height={350}
                        width={300}
                        searchDisabled={false}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                    />
                </div>
            )}

            {/* ------- Input Bar ------- */}
            <div className='flex items-center gap-2 px-3 py-2 bg-[#202c33]'>
                {/* Emoji button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowEmoji(prev => !prev) }}
                    className='text-[#8696a0] hover:text-[#e9edef] transition-colors p-1'
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                    </svg>
                </button>

                {/* Image upload */}
                <input onChange={handleImageSelect} type="file" id='image' accept='image/png, image/jpeg' hidden />
                <label htmlFor="image" className='text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer p-1'>
                    <img src={assets.gallery_icon} alt="" className="w-5" />
                </label>

                {/* Text input */}
                <div className='flex-1 bg-[#2a3942] rounded-lg px-4 py-2'>
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
                        type="text"
                        placeholder="Type a message"
                        className='w-full bg-transparent border-none outline-none text-[#e9edef] text-sm placeholder-[#8696a0]'
                    />
                </div>

                {/* Send button */}
                {/* Send button */}
                <button
                    onClick={handleSendMessage}
                    disabled={sending}
                    className='text-[#8696a0] hover:text-[#00a884] transition-colors p-1 disabled:opacity-50'
                >
                    <img src={assets.send_button} alt="" className="w-7" />
                </button>
            </div>
        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-3 bg-[#222e35] max-md:hidden flex-1'>
            <img src={assets.logo_icon} className='w-16 opacity-20' alt="" />
            <p className='text-[#8696a0] text-lg font-light'>HumbleTree</p>
            <p className='text-[#8696a0] text-sm'>Click on a chat to start messaging</p>
        </div>
    )
}

export default ChatContainer