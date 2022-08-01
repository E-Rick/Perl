import { AppProviders } from '@/components/AppProviders'
import type { AppProps } from 'next/app'
import 'tailwindcss/tailwind.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'degen/styles'

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
	return (
		<AppProviders>
			<Component {...pageProps} />
		</AppProviders>
	)
}

export default App
