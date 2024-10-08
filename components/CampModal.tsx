//@ts-nocheck

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import NFTItem from "./NFTItem";
import { mariusApi } from "@/lib/api/marius-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCookie } from "cookies-next";
import { responses } from "@/lib/util/response-util.const";
import { toast } from "sonner";

export default function CampModal({
  open,
  setOpen,
  walletNFTs,
  stateFairNfts,
  hospitalNfts,
  wallStreetNfts,
  isHospitalOpened,
  handleNftChange,
}: any) {
  const [activeTab, setActiveTab] = useState(
    isHospitalOpened ? "hospital" : "mynfts"
  );
  const [selectedMintAddresses, setSelectedMintAddresses] = useState([]);
  const { publicKey } = useWallet();
  const csrfToken = getCookie("csrf");
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [loadingRelease, setLoadingRelease] = useState(false);


  const handleSelect = (mintAddress: any) => {
    setSelectedMintAddresses((prevSelected: any) => {
      if (prevSelected.includes(mintAddress)) {
        return prevSelected.filter((address: any) => address !== mintAddress);
      } else {
        return [...prevSelected, mintAddress];
      }
    });
  };


  const checkAllowedToGo = (nft) => {
    const now = Date.now();
    console.log(nft)
    const allowedTime = parseInt(nft.timestampAllowedToLeave) * 1000;
    console.log('time: ', allowedTime)
    return now > allowedTime;
  };

  const releaseAll = async () => {
    setLoadingRelease(true);

    const releasePromises = selectedMintAddresses.map(async (mintAddress) => {
      try {
        const theNft = hospitalNfts.filter((nft) => nft.mintId === mintAddress)[0];

        let allowedToLeave = await checkAllowedToGo(theNft) ? 0 : 1;

        const response = await mariusApi.exitHospital(
          publicKey!.toBase58(),
          mintAddress,
          allowedToLeave,
          csrfToken!
        );
        console.log(response);

        if (response.error) {
          toast.error(`Error from releasing NFT: Check your balance`);
          return;
        }

        if (!responses.isSuccess(response)) {
          toast.error("Error releasing NFT");
          return;
        }
      } catch (error) {
        console.error(`Error in releasing NFTs: ${error}`);
      }
    });

    // Wait for all promises to resolve
    await Promise.all(releasePromises);

    setSelectedMintAddresses([]);
    handleNftChange(true);

    const event = new CustomEvent("level-upgrade");

    const eventRew = new CustomEvent("refresh-rewards");
    window.dispatchEvent(event);
    window.dispatchEvent(eventRew);

    setOpen(false);
    setLoadingRelease(false);
  };

  const claimNfts = async () => {
    setLoadingClaim(true);
    try {
      const exitZonePromises = selectedMintAddresses.map(
        async (mintAddress) => {
          try {
            const response = await mariusApi.exitZone(
              publicKey!.toBase58(),
              [mintAddress],
              csrfToken!
            );

            console.log(response);

            if (response.error) {
              toast.error(`Error from claiming NFTs: ${response.error}`);
            }

            if (!responses.isSuccess(response)) {
              toast.error("Error claiming NFTs");
            }
          } catch (error) {
            console.error(`Error in claiming NFTs: ${error}`);
          }
        }
      );

      // Wait for all promises to resolve
      await Promise.all(exitZonePromises);

      setLoadingClaim(false);

      const event = new CustomEvent("level-upgrade");

      const eventRew = new CustomEvent("refresh-rewards");
      window.dispatchEvent(event);
      window.dispatchEvent(eventRew);
      setOpen(false);
      setSelectedMintAddresses([]);
      handleNftChange(true);
      setLoadingClaim(false);
      toast.success("NFTs claimed");
    } catch (error) {
      console.error("exit game error:", error);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[999999]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 black-glass bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full lg:w-[70%] text-white  transform overflow-hidden rounded-lg bg-black p-10 text-left shadow-xl transition-all ">
                <div className="w-full flex items-center justify-between gap-5">
                  <button
                    onClick={() => setActiveTab("mynfts")}
                    className={`flex-1 flex outline-0 uppercase py-1.5 cursor-pointer hover:opacity-80 justify-center items-center gap-2 rounded-lg ${
                      activeTab === "mynfts"
                        ? "bg-white text-black"
                        : "bg-black text-white border border-[#555555]"
                    }`}
                  >
                    MY NFTS
                  </button>
                  <button
                    onClick={() => setActiveTab("mission")}
                    className={`flex-1 flex outline-0 uppercase py-1.5 cursor-pointer hover:opacity-80 justify-center items-center gap-2 rounded-lg ${
                      activeTab === "mission"
                        ? "bg-white text-black"
                        : "bg-black text-white border border-[#555555]"
                    }`}
                  >
                    ON MISSION
                  </button>
                  <button
                    onClick={() => setActiveTab("hospital")}
                    className={`flex-1 flex outline-0 uppercase py-1.5 cursor-pointer hover:opacity-80 justify-center items-center gap-2 rounded-lg ${
                      activeTab === "hospital"
                        ? "bg-white text-black"
                        : "bg-black text-white border border-[#555555]"
                    }`}
                  >
                    HOSPITAL
                  </button>
                </div>
                {activeTab === "mynfts" ? (
                  <>
                    <div className="relative max-h-[400px] overflow-scroll mb-5">
                      <div className="py-10 grid grid-cols-3 lg:grid-cols-5 gap-5 overflow-y-scroll">
                        {walletNFTs.map((nft: any) => (
                          <NFTItem
                            key={nft.mintId}
                            nft={nft}
                            showUpgrade={true}
                            isOnGame={false}
                            onSelect={handleSelect}
                            isSelected={selectedMintAddresses.includes(
                              nft.mintId
                            )}
                          />
                        ))}
                      </div>
                      <div className="sticky bottom-0 h-10 left-0 right-0 bg-gradient-to-t from-black to-transparent"></div>
                    </div>
                  </>
                ) : activeTab === "mission" ? (
                  <div className="relative max-h-[400px] overflow-scroll mb-5">
                    {[...stateFairNfts, ...wallStreetNfts].length > 0 ? (
                      <>
                        <div className="py-10 grid grid-cols-3 lg:grid-cols-5 gap-5 overflow-y-scroll">
                          {[...stateFairNfts, ...wallStreetNfts].map(
                            (nft: any) => (
                              <NFTItem
                                isOnGame={true}
                                showUpgrade={false}
                                key={nft.mintId}
                                nft={nft}
                                onSelect={handleSelect}
                                isSelected={selectedMintAddresses.includes(
                                  nft.mintId
                                )}
                              />
                            )
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="w-full text-center mt-10">
                        No NFTs on mission
                      </div>
                    )}

                    <div className="sticky bottom-0 h-10 left-0 right-0 bg-gradient-to-t from-black to-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="relative max-h-[400px] overflow-scroll mb-5">
                      {hospitalNfts.length > 0 ? (
                        <>
                          <div className="py-10 grid grid-cols-3 lg:grid-cols-5 gap-5 overflow-y-scroll">
                            {hospitalNfts.map((nft: any) => (
                              <NFTItem
                                key={nft.mintId}
                                isOnGame={true}
                                showUpgrade={false}
                                nft={nft}
                                onSelect={handleSelect}
                                isSelected={selectedMintAddresses.includes(
                                  nft.mintId
                                )}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="w-full text-center mb-10 mt-10 uppercase">
                          No NFTs in hospital
                        </div>
                      )}

<div className="flex items-center gap-5 w-full mx-auto">
                    {loadingRelease ? (
                        <>
            
                          <button className="bg-[#FCB72A] outline-none uppercase font-bold text-black p-2 rounded-lg w-full cursor-pointer hover:opacity-80">
                            <div role="status">
                              <svg
                                aria-hidden="true"
                                className="inline w-5 h-5 text-black animate-spin fill-white"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                  fill="currentFill"
                                />
                              </svg>
                              <span className="sr-only">Loading...</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={releaseAll}
                            disabled={hospitalNfts.length === 0}
                            className="bg-[#FCB72A] outline-none uppercase font-bold text-black p-2 rounded-lg w-full cursor-pointer hover:opacity-80"
                          >
                            RELEASE SELECTED
                          </button>
                        </>
                      )}
  
                      </div>        

                      <div className="sticky bottom-0 h-10 left-0 right-0 bg-gradient-to-t from-black to-transparent"></div>
                    </div>
                  </>
                )}

                {activeTab === "mission" &&
                  [...stateFairNfts, ...wallStreetNfts].length > 0 && (
                    <div className="flex items-center gap-5 w-full mx-auto">
                      {loadingClaim ? (
                        <>
                          <button className="bg-[#FCB72A] outline-none uppercase font-bold text-black p-2 rounded-lg w-full cursor-pointer hover:opacity-80">
                            <div role="status">
                              <svg
                                aria-hidden="true"
                                className="inline w-5 h-5 text-black animate-spin fill-white"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                  fill="currentFill"
                                />
                              </svg>
                              <span className="sr-only">Loading...</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={claimNfts}
                            disabled={selectedMintAddresses.length === 0}
                            className="bg-[#FCB72A] outline-none uppercase font-bold text-black p-2 rounded-lg w-full cursor-pointer hover:opacity-80"
                          >
                            CLAIM SELECTED
                          </button>
                        </>
                      )}
                    </div>
                  )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
