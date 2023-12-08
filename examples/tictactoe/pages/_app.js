import '@/styles/globals.css'

// Waku imports
import { LightNodeProvider } from "@waku/react";
import { Protocols } from "@waku/sdk";



export default function App({ Component, pageProps }) {
  return (
    <LightNodeProvider
      options={{ defaultBootstrap: true }}
      protocols={[Protocols.Store, Protocols.Filter, Protocols.LightPush]}
    >
      <Component {...pageProps} />
    </LightNodeProvider>
  )
}
