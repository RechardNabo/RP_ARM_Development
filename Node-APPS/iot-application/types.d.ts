// Type declarations for missing modules

// React types
declare module 'react' {
  export = React;
  export as namespace React;
  namespace React {
    type ReactNode = 
      | string
      | number
      | boolean
      | null
      | undefined
      | React.ReactElement
      | React.ReactFragment
      | React.ReactPortal;
      
    interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
      type: T;
      props: P;
      key: Key | null;
    }
    
    type JSXElementConstructor<P> = (props: P) => ReactElement<any, any> | null;
    
    interface ReactFragment {}
    interface ReactPortal extends ReactElement {}
    type Key = string | number;
    
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // Standard HTML Attributes
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      // Add other HTML attributes as needed
    }
    
    interface CSSProperties {
      [key: string]: string | number | undefined;
    }
    
    interface AriaAttributes {}
    
    interface DOMAttributes<T> {
      children?: ReactNode;
      onClick?: (event: any) => void;
      // Add other DOM event handlers as needed
    }
    
    // Hook types
    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    function useEffect(effect: () => void | (() => void | undefined), deps?: ReadonlyArray<any>): void;
  }
}

// Define JSX namespace
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactElement {}
}

// Node.js modules
declare module 'child_process' {
  export function exec(command: string, options?: any, callback?: (error: Error | null, stdout: string, stderr: string) => void): any;
  export function execSync(command: string, options?: any): Buffer | string;
}

declare module 'util' {
  export function promisify<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => Promise<any>;
}

// Next.js modules
declare module 'next/server' {
  export class NextResponse {
    static json(body: any, init?: ResponseInit): NextResponse;
  }
  
  interface ResponseInit {
    status?: number;
    headers?: HeadersInit;
  }
}
