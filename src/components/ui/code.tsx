import React from 'react';
import { cn } from '@/lib/utils';

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'inline' | 'block';
  language?: 'javascript' | 'typescript' | 'solidity' | 'json';
  showLineNumbers?: boolean;
  maxHeight?: string;
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, variant = 'inline', language, showLineNumbers = false, maxHeight, children, ...props }, ref) => {
    if (variant === 'inline') {
      return (
        <code
          ref={ref as React.RefObject<HTMLElement>}
          className={cn(
            'relative rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm font-normal text-neutral-900',
            'before:content-["`"] after:content-["`"]',
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <pre
        ref={ref as React.RefObject<HTMLPreElement>}
        className={cn(
          'relative overflow-auto rounded-md bg-neutral-900 p-4 font-mono text-sm text-neutral-100',
          maxHeight && `max-h-[${maxHeight}]`,
          showLineNumbers && 'counter-reset: line',
          className
        )}
        style={{ maxHeight }}
        {...props}
      >
        {showLineNumbers && (
          <style jsx>{`
            .line-number::before {
              counter-increment: line;
              content: counter(line);
              display: inline-block;
              width: 2rem;
              margin-right: 1rem;
              color: rgb(156 163 175);
              text-align: right;
              user-select: none;
            }
          `}</style>
        )}
        <code className={showLineNumbers ? 'block' : ''}>
          {showLineNumbers
            ? React.Children.map(children, (child, index) => (
                <span key={index} className="line-number block">
                  {child}
                </span>
              ))
            : children}
        </code>
      </pre>
    );
  }
);

Code.displayName = 'Code';

export { Code };