import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardActions } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Text } from "./text"

export interface LoanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
  amount: number
  aiScore: number
  borrower: string
  location: string
  crop: string
  interestRate: number
  termDays: number
  fundedPercentage: number
  status: 'active' | 'funded' | 'completed' | 'defaulted'
  thumbnail?: string
  onFund?: (id: string) => void
  onViewDetails?: (id: string) => void
}

const LoanCard = React.forwardRef<HTMLDivElement, LoanCardProps>(
  ({
    className,
    id,
    amount,
    aiScore,
    borrower,
    location,
    crop,
    interestRate,
    termDays,
    fundedPercentage,
    status,
    thumbnail,
    onFund,
    onViewDetails,
    ...props
  }, ref) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'success'
        case 'funded': return 'info'
        case 'completed': return 'primary'
        case 'defaulted': return 'error'
        default: return 'outline'
      }
    }

    const getRiskLevel = (score: number) => {
      if (score >= 750) return { level: 'Low', color: 'success' as const }
      if (score >= 650) return { level: 'Medium', color: 'warning' as const }
      return { level: 'High', color: 'error' as const }
    }

    const risk = getRiskLevel(aiScore)

    return (
      <Card
        ref={ref}
        className={cn("w-80 h-72 overflow-hidden hover:shadow-level-3 transition-shadow cursor-pointer", className)}
        onClick={() => onViewDetails?.(id)}
        {...props}
      >
        {thumbnail && (
          <div className="aspect-video overflow-hidden">
            <img
              src={thumbnail}
              alt={`${borrower}'s farm`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardContent className="flex-1 p-md">
          <div className="flex items-start justify-between mb-sm">
            <div>
              <Text size="lg" weight="semibold" className="text-neutral-900">
                ${amount.toLocaleString()}
              </Text>
              <Text size="sm" color="neutral-600">
                {borrower}
              </Text>
            </div>
            <Badge variant={getStatusColor(status)}>
              {status}
            </Badge>
          </div>

          <div className="space-y-xs mb-md">
            <div className="flex items-center justify-between">
              <Text size="sm" color="neutral-600">AI Score</Text>
              <Text size="sm" weight="semibold" color={risk.color === 'success' ? 'success' : risk.color === 'warning' ? 'warning' : 'error'}>
                {aiScore}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text size="sm" color="neutral-600">Risk</Text>
              <Badge variant={risk.color as 'success' | 'warning' | 'error'} size="sm">
                {risk.level}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <Text size="sm" color="neutral-600">Interest</Text>
              <Text size="sm" weight="semibold">{interestRate}%</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text size="sm" color="neutral-600">Term</Text>
              <Text size="sm" weight="semibold">{Math.round(termDays / 30)} months</Text>
            </div>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <Text size="xs" color="neutral-500">Location</Text>
              <Text size="xs" weight="medium">{location}</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text size="xs" color="neutral-500">Crop</Text>
              <Text size="xs" weight="medium">{crop}</Text>
            </div>
          </div>
        </CardContent>

        <CardActions className="p-md pt-0">
          <div className="w-full space-y-sm">
            <div className="flex items-center justify-between">
              <Text size="xs" color="neutral-500">Funded</Text>
              <Text size="xs" weight="semibold">{fundedPercentage}%</Text>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${fundedPercentage}%` }}
              />
            </div>
          </div>

          {status === 'active' && (
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                onFund?.(id)
              }}
            >
              Fund Loan
            </Button>
          )}
        </CardActions>
      </Card>
    )
  }
)

LoanCard.displayName = "LoanCard"

export { LoanCard }