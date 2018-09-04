import { lensProp, view } from 'ramda'

export const id = lensProp('id')

export const getId = view(id)
