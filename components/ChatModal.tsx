import { Fragment, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import FlipClockCountdown from "@leenguyen/react-flip-clock-countdown";
import FlipCard from "react-countdown-flip-card";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { RiTwitterXLine, RiUpload2Line } from "react-icons/ri";
import {Button, Upload} from 'antd';
import confetti from 'canvas-confetti';
import io from 'socket.io-client';
import { useDropzone } from 'react-dropzone';
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount
} from '@solana/spl-token';
import {
  PublicKey,
  Transaction,
  Connection,
  TransactionInstruction
} from '@solana/web3.js';
import "@leenguyen/react-flip-clock-countdown/dist/index.css";
import axios from "axios";
import ScrollToBottom from 'react-scroll-to-bottom';
import { SignerWalletAdapterProps } from "@solana/wallet-adapter-base";
import EmojiPicker from 'emoji-picker-react';

export default function ChatModal({
  open,
  balance,
  setOpen,
  handleBalanceChange,
  walletAddress,
  isLogin,
  setIsLogin,
  userName,
  setUserName,
  unreadMessage,
  setUnreadMessage,
  alert,
  setAlert,
  avatarUrl
}: any) {
  const { connection } = useConnection();
  const finalMessageRef = useRef(null);
  const [name, setName] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any>([]);
  const [isusernameLength, setUserNameLength] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [messagecontent, setMessageContent] = useState('');
  const [onecheck, setOneCheck] = useState(false);
  const [twocheck, setTwoCheck] = useState([]);
  const [files, setFiles] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<"initial" | "uploading" | "success" | "fail">("initial");
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [isemoji, setIsEmoji] = useState(false);
  let count = 0;
  const server_url = "https://last-haven-server.onrender.com/";

 useEffect(() => {
  const init = async () => {
    if(isLogin) {
      try {
        const res = await axios.get(server_url+'api/chat/message');
        setMessages(res.data.message)
        setOneCheck(true);
      } catch (err) {
         console.log(err)
      }
    }
  }
  init();
 }, [isLogin])
 
  useEffect (() => {
    if(open == false ) {
      socket.emit('logout', {username: userName, logined: false})}
  },[open]);
 
  const socket = io('https://last-haven-server.onrender.com/');

  useEffect(() => {

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('message', (message: any) => {
      setMessages((messages: any) => [...messages, message]);
      const time = new Date(message.timestamp);
      const hour = time.getHours();
      const minute = time.getMinutes();
      setOneCheck(true);
      setImage('');
    });

    socket.on('checked', async (message)=> {
      console.log(message);
      await setMessages(message);
    })

    setUserName(name);

    socket.on('Alert', async (message) => {
      console.log('message:', message, 'wallet', walletAddress);
      if(message.walletAddress == walletAddress) {
        await setAlert(message.alert); console.log(123);
      }
      console.log('alert', alert);
      
    })
  }, []);

  useEffect(() => {
    console.log(open);
    
    if (!open) {
      socket.emit('format', {walletAddress: walletAddress});
    }
  }, [open, setOpen]);

  const configureAndSendCurrentTransaction = async (
    transaction: Transaction,
    connection: Connection,
    feePayer: PublicKey,
    signTransaction: SignerWalletAdapterProps['signTransaction']
  ) => {
    const blockHash = await connection.getLatestBlockhash();
    transaction.feePayer = feePayer;
    transaction.recentBlockhash = blockHash.blockhash;
    const signed = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction({
      blockhash: blockHash.blockhash,
      lastValidBlockHeight: blockHash.lastValidBlockHeight,
      signature
    });
    return signature;
  };

  const handleRegister = () => {
    const userData = { username: name, walletAddress: walletAddress, avatarUrl: avatarUrl };
    socket.emit('login', userData);
  }

  socket.on('login', (newUser) => {
    setIsLogin(true);
    setUserName(newUser.username)
  })

  socket.on('userexist', (message) => {
    setIsValid(true);
  })

  const handleMessage = () => {
    setIsEmoji(isemoji => false);
    setMessageContent(message);
    if (isConnected) {
      if (message !== '') {
        const newMessage = { username:userName, message:message, avatar: avatarUrl, image: image };
        socket.emit('message', newMessage);
      }
    }

    setMessage('')
  }

  const handleKeyDown = (event: any) => {
    if (event.charCode == 13) {
      handleMessage();
    }
  }

  const handleSubmitKeyDown = (event: any) => {
    if (event.charCode == 13) {
      handlePaymentDown();
    }
  }
   
  const handleFileChange = (e: any) => {
    console.log("file: ", e.target.files[0])
    if (e.target.files) {
      setFiles(e.target.files);
      setStatus("initial");
    }
  };

  // const handleImageChange = async (e: any) => {
  //   const file = e.target.files[0];
  //   const reader = new FileReader();
  //   reader.onload = (event: any) => {
  //     const base64String = event.target.result;
  //     setImage(base64String);
  //   };
  //   reader.readAsDataURL(file);
  // }

  const handlePaymentDown = async () => {
    const toPublicKey = new PublicKey("73R6q8EeemG7cwm3moPZfaZcAthbfjpr4mjwvraXZWGY");
    const mintToken = new PublicKey('3AdohYQukY24FusgsruJ1jxkxocyg4TPPEwYxgkfGHWs');
    // const amount = ticketPrice * 100000 * Math.pow(10, 9);
    const amount = 20000 * Math.pow(10, 9);
    // const amount = 0.3 * 1000000 * Math.pow(10, 9);
    const transactionInstructions: TransactionInstruction[] = [];
    let associatedTokenFrom;
    if (publicKey !== null) {
      associatedTokenFrom = await getAssociatedTokenAddress(
        mintToken,
        publicKey
      );

      const fromAccount = await getAccount(connection, associatedTokenFrom);
      const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        toPublicKey
      );
      if (!(await connection.getAccountInfo(associatedTokenTo))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenTo,
            toPublicKey,
            mintToken
          )
        );
      }
      transactionInstructions.push(
        createTransferInstruction(
          fromAccount.address, 
          associatedTokenTo, 
          publicKey,
          amount 
        )
      );
      const transaction = new Transaction().add(...transactionInstructions);
      if (signTransaction !== undefined) {
        const signature = await configureAndSendCurrentTransaction(
          transaction,
          connection,
          publicKey,
          signTransaction
        );
        if (signature) {
          handleRegister();
        }
        else alert("you have to pay for this Chat");
      }
    }
  }

  return (
    <>
      {open == true ? (
        <>
          <div className="absolute flex w-full h-full justify-end z-[98] right-[23px] mt-[36px] border-0.85 border-gradient-to-b from-blue-500 to-green-500" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false); 
            }}}
          >
            <div className="inline-flex w-[325px] h-[584px] left-[15%]  bg-black/85 backdrop-blur-[4px] rounded-[12.75px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEmoji(emoji => false);
              }
            }}
            >

              <div className="relative w-[100%] h-full justify-center items-center overflow-y-scroll">
                {isLogin == true ? (
                  <>
                    <button className="ml-[87%] mt-[14px]" onClick={() => { setOpen(false) }}>
                      <img src="/close.png"></img>
                    </button>
                
                    <ScrollToBottom
                      className="w-[100%] h-[78%] max-h-[80%] flex flex-col justify-end mb-[15px]"
                    >                      
                      {messages.map( (msg: any) => {  
                        const time = new Date(msg.timestamp);
                        const hour = time.getHours();
                        const minute = time.getMinutes();
                        return (
                        <>
                        <div className="flex justify-start items-end mb-[5px]">
                          <div className='flex flex-col max-w-[95%]'>
                            <div className='flex justify-start items-end'>
                              <div>
                                <img className="mx-[6px] w-[36px] h-[36px] rounded-full  p-[3px]" src={msg.avatar != 'false' ? msg.avatar : "/pfp.png"} />
                                <div className = "text-[10px] text-[#272829] w-[100%] flex items-center justify-center"> {msg.userName} </div>
                              </div>
                              <div>
                                <div>
                                {
                                  msg.message && 
                                  <div className="text-white text-[10px] font-light rounded-[6px] p-[12px] leading-[1] max-w-[100%] break-words"
                                    style={{ backgroundColor: userName !== msg.userName ? "#55555545" : "#3A455545" }}
                                  >
                                    {msg.message}
                                  </div>
                                }
                                </div>                         
                                <div className= 'flex justify-end items-end text-[#272829] text-[10px]'>
                                  <p>{hour}:{minute}</p>
                                  <div className="relative">
                                  {
                                    onecheck ? (
                                      <img src="/check1.png" alt="check" className=" w-[8px] h-[7px] mb-[3px] ml-[3px]"/>
                                    ): null
                                  }
                                  {
                                    msg.readed.length>0 ? (
                                      <img src="/check2.png" alt="check" className="absolute right-[-3px] bottom-[3px] w-[7px] h-[7px]" />
                                    ): null
                                  }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        </>
                      )}
                      )}                    
                    </ScrollToBottom>
                    <div className="inline-flex w-[100%] h-[34px] justify-center">
                    <input 
                        type="text" 
                        className="bg-black/60 w-[75%] rounded-[6px] h-[34px] text-xs text-white ml-[10px] border border-555555 pl-[10px] break-words " 
                        placeholder='Write a message...'
                        value={message}
                        onChange={event => {                          
                          setMessage(event.target.value);
                          // console.log(message);
                        }}
                        onKeyPress = {e => 
                          handleKeyDown(e)
                        }
                      />
                      <div className="flex w-[34px] h-[34px] items-center justify-center bg-white rounded-[6px] bg-cover ml-[5px] mr-[5px] mb-[10px]" onClick={e => setIsEmoji(isemoji => !isemoji)}>                        
                        <img className="mx-[6px] w-[34px] h-[30px] rounded-full  p-[3px]" src="./emoji.png" />
                      </div>
                      
                      <button
                        disabled={!isConnected}
                        onClick = {handleMessage}
                        className="bg-white w-[34px] rounded-[6px] h-[34px] text-white inline-flex items-center justify-center mr-[10px]"
                      >
                        <img className="mx-[6px]" src="/send.png" />
                      </button>
                    </div>
                    <div style={{ display: isemoji ? 'block' : 'none' }} >
                      <EmojiPicker style={{position: 'absolute', width: '300px', height: '350px', right: '10px', top: '170px'}}
                        onEmojiClick={emoji =>{ setMessage(message => message+emoji.emoji); setIsEmoji(isemoji => false);}}/>
                    </div>
                  </>
                ):(
                  <>
                    <button className="ml-[87%] mt-[14px]" onClick={() => { setOpen(false) }}>
                      <img src="/close.png"></img>
                    </button>
                    <div className="flex flex-col w-[100%] h-[70%] justify-center items-center">
                      <input 
                        type="text" 
                        className="bg-black/60 w-[80%] rounded-[6px] h-[40px] text-sm text-white border border-555555 pl-[20px] mb-[3px]" 
                        placeholder='username'
                        onChange={(e) => {
                          const user = e.target.value
                          setName(e.target.value);
                          if ( user === '') {
                            setUserNameLength(true)
                          } 
                        }}
                      />
                      {
                        isValid == true ? (
                          isusernameLength == false ? (
                            <p className="text-[#EE3300] text-xs">Username must be more than 3 letters</p>
                          ):(
                            <p className="text-[#EE3300] text-xs">Validation Error! The user already exists.</p>
                          )
                        ): (null)
                      }
                      <button
                        className="bg-white w-[80%] rounded-[6px] h-[40px] text-black text-bold inline-flex items-center justify-center mt-[20px]"
                        onClick = {e => handleRegister()}
                        onKeyPress = {e => 
                          handleSubmitKeyDown(e)
                        }
                      >
                        Register
                      </button>
                    </div>
                  </>
                )

                }
              </div>
            </div>
          </div>
          
        </>
      ) : null}
    </>
  );
};
