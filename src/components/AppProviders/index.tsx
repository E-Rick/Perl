import React from 'react'
import { APP_NAME } from '@/lib/consts'

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { ThemeProvider } from 'degen'

import { chain, createClient, WagmiConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'

const { chains, provider } = configureChains(
	[chain.mainnet, chain.rinkeby],
	[alchemyProvider({ apiKey: process.env.ALCHEMY_ID }), publicProvider()]
)

const { connectors } = getDefaultWallets({ appName: APP_NAME, chains })
const wagmiClient = createClient({ autoConnect: true, connectors, provider })

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider>
			<WagmiConfig client={wagmiClient}>
				<RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
			</WagmiConfig>
		</ThemeProvider>
	)
}
