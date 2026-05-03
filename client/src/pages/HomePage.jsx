import React from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { useContext } from 'react'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {
    const { selectedUser } = useContext(ChatContext)

    return (
        <div className='w-full h-screen overflow-hidden'>
            <div className={`h-full grid grid-cols-1 relative
                ${selectedUser
                    ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
                    : 'md:grid-cols-[1fr_2fr]'
                }`}>
                <Sidebar />
                <ChatContainer />
                <RightSidebar />
            </div>
        </div>
    )
}

export default HomePage