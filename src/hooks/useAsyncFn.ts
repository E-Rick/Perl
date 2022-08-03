import { DependencyList, Dispatch, SetStateAction, useCallback, useRef, useState } from 'react'

import { useIsMounted } from './useIsMounted'

export type Await<T> = T extends PromiseLike<infer U> ? U : T

export type AsyncFunction = (...args: any[]) => Promise<any>

export type AsyncState<T> =
	| {
			loading: boolean
			error?: undefined
			data?: undefined
	  }
	| {
			loading: true
			promise: Promise<T>
			error?: Error | undefined
			data?: T
	  }
	| {
			loading: false
			error: Error
			data?: undefined
	  }
	| {
			loading: false
			error?: undefined
			data: T
	  }

type ResetStateFunction<T extends AsyncFunction> = Dispatch<SetStateAction<StateFromAsyncFunction<T>>>

type StateFromAsyncFunction<T extends AsyncFunction> = AsyncState<Await<ReturnType<T>>>

export type AsyncFnReturn<T extends AsyncFunction = AsyncFunction> = [
	StateFromAsyncFunction<T> & { reset: ResetStateFunction<T> },
	T
]

export function useAsyncFn<T extends AsyncFunction>(
	fn: T,
	deps: DependencyList = [],
	initialState: StateFromAsyncFunction<T> = { loading: false }
): AsyncFnReturn<T> {
	const lastCallId = useRef(0)
	const isMounted = useIsMounted()
	const [state, set] = useState<StateFromAsyncFunction<T>>(initialState)

	const callback = useCallback((...args: Parameters<T>): ReturnType<T> => {
		const callId = ++lastCallId.current

		const promise = fn(...args).then(
			data => {
				isMounted() && callId === lastCallId.current && set({ data, loading: false })

				return data
			},
			error => {
				isMounted() && callId === lastCallId.current && set({ error, loading: false })

				throw error
			}
		) as ReturnType<T>

		set(prevState => ({ ...prevState, loading: true, promise }))

		return promise
	}, deps)

	const reset: typeof set = useCallback((...args) => {
		lastCallId.current++
		set(...args)
	}, [])

	return [{ ...state, reset }, callback as unknown as T]
}
