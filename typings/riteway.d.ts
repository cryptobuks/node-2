declare module 'riteway' {
  export function describe(label: string, callback: describeCallback): void

  export function Try(fn: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any): any

  type describeCallback = (should: should) => Promise<void>

  type should = (label?: string) => { assert: assert }

  type assert = (assertion: Assertion) => void

  interface Assertion {
    readonly given: string
    readonly should?: string
    readonly actual: any
    readonly expected: any
  }
}
