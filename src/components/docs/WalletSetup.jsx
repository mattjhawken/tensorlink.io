import { Link } from "react-router-dom";

const WalletSetup = () => (
  <section className="px-5 md:px-10 flex flex-col border-t dark:border-t-white border-t-black items-center h-full">
    <div className="text-left justify-center items-center max-w-[1280px]">
      <div className="pb-4 mb-4 border-b dark:border-neutral-800 border-neutral-200">
        <h1 className="text-4xl font-bold dark:text-white text-neutral-900 mb-2">
          Wallet config
        </h1>
        <p className="text-lg dark:text-neutral-400 text-neutral-600">
          As Tensorlink is in alpha, this step is unnecessary. Please conitinue to the <Link to="/docs/model-example" className="underline text-blue-400">next page.</Link>
        </p>
      </div>

      <p className="text-sm sm:text-base leading-relaxed dark:text-neutral-300 text-neutral-700 mb-4">
        To utilize Tensorlink for larger models and rate-limit-free services, you'll need Smartnodes tokens (SNO) to compensate workers and validators for their services. 
        SNO is an ERC20 token, enabling you to easily connect any web wallet to access services (e.g., MetaMask, Trust Wallet, etc.)
      </p>
    
      <h2 className="text-2xl font-semibold dark:text-white text-neutral-900 mb-3 pb-2 border-b dark:border-neutral-800 border-neutral-200">
        Signing Up
      </h2>
      <p className="text-sm sm:text-base leading-relaxed dark:text-neutral-300 text-neutral-700 mb-4">
        To access Tensorlink's full services, you must first sign up as a User on the Smart Nodes contract. 
        If you have already registered, you may skip to the next step. 
      </p>

      <p className="text-sm sm:text-base leading-relaxed dark:text-neutral-300 text-neutral-700 mb-4">
        Visit the <Link to="/app" className="underline text-blue-400">Smart Nodes Interface</Link> and connect your web wallet with the account that you want associated with Tensorlink. 
        Once connected, navigate to the "Create User" option on the sign-up screen. Here you will be required to 
        input a user ID hash. This value belongs to a set of credentials that are automatically generated for you when installing Tensorlink. 
        These keys are essential for accessing Tensorlink's services and should be kept secure. Select "Import Public Key" and find the public_key.pem file
        in the Tensorlink directory.
      </p>
    </div>

    {/* Navigation */}
    <div className="flex mt-8 mb-10 justify-between max-w-[1200px] w-full pt-8 border-t dark:border-neutral-800 border-neutral-200">
        <NavButton className="text-left" title="Node Setup" subtitle="Previous" page="nodes" />
      <NavButton className="text-right" title="Runnig a Model" subtitle="Next" page="model-example" />
    
      <div className="text-left">
        <div className="text-sm dark:text-neutral-500 text-neutral-500 mb-1">Previous</div>
        <a href="/" className="text-base font-medium dark:text-blue-400 text-blue-600 hover:underline">
          Home
        </a>
      </div>
      <div className="text-right">
        <div className="text-sm dark:text-neutral-500 text-neutral-500 mb-1">Next</div>
        <a href="start" className="text-base font-medium dark:text-blue-400 text-blue-600 hover:underline">
          Getting Started
        </a>
      </div>
    </div>
  </section>
);
export default WalletSetup;
