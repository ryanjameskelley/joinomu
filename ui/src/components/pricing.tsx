import * as React from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Check, Info } from 'lucide-react'

// JoinOmu Logo Component
function JoinOmuLogo({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 18C12 21.3137 9.31371 24 6 24C2.68629 24 0 21.3137 0 18C0 14.6863 2.68629 12 6 12C9.31371 12 12 14.6863 12 18Z" fill="url(#paint0_linear_202_550)"/>
      <path d="M6 3C6 1.34315 7.34315 0 9 0C10.6569 0 12 1.34315 12 3V12H6V3Z" fill="url(#paint1_linear_202_550)"/>
      <path d="M12 3C12 1.34315 13.3431 0 15 0C16.6569 0 18 1.34315 18 3V12H12V3Z" fill="url(#paint2_linear_202_550)"/>
      <path d="M12 12H24V18C24 21.3137 21.3137 24 18 24C14.6863 24 12 21.3137 12 18V12Z" fill="url(#paint3_linear_202_550)"/>
      <defs>
        <linearGradient id="paint0_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint1_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint2_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint3_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export interface PricingProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function Pricing({
  open = true,
  onOpenChange,
  className
}: PricingProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <style jsx>{`
        @media (min-width: 768px) {
          .pricing-panel {
            border-radius: 8px !important;
          }
          .left-card-desktop {
            border-radius: 14px 0 0 14px !important;
          }
          .cards-container {
            flex-direction: row !important;
            gap: 0 !important;
            width: 769px !important;
          }
        }
        @media (max-width: 767px) {
          .pricing-panel {
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
          }
          .cards-container {
            flex-direction: column !important;
            gap: 16px !important;
            width: 100% !important;
            max-width: none !important;
            margin-bottom: 32px !important;
          }
          .left-card-desktop, .right-card-desktop {
            border-radius: 14px !important;
            width: 100% !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          }
          .pricing-header {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 20px !important;
            margin-bottom: 32px !important;
            padding: 0 16px !important;
          }
          .pricing-content {
            padding: 32px 16px !important;
          }
          .pricing-main-container {
            align-items: flex-start !important;
            justify-content: flex-start !important;
            padding-top: 32px !important;
          }
        }
      `}</style>
      <div 
        className="pricing-panel fixed bg-muted overflow-auto"
        style={{
          top: '24px',
          left: '24px',
          right: '24px',
          bottom: '24px'
        }}
      >
        <section className="pricing-content" style={{ backgroundColor: '#f8f9fa', padding: '64px 0', height: '100%', position: 'relative' }}>
          {/* Background gradients */}
          <div 
            className="absolute inset-0" 
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(187, 221, 255, 0.3) 0%, transparent 20%),
                radial-gradient(circle at 70% 60%, rgba(200, 90, 21, 0.2) 0%, transparent 20%)
              `
            }}
          ></div>
          <div className="pricing-main-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', position: 'relative', zIndex: '1' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', width: '100%' }}>
              <div className="pricing-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '576px' }}>
                <JoinOmuLogo style={{ width: '24px', height: '24px' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#737373', fontSize: '14px', lineHeight: '20px', fontWeight: '500' }}>JoinOmu Pricing</p>
                </div>
                <p style={{ color: '#737373', fontSize: '16px', lineHeight: '24px', textAlign: 'center' }}>
                  Either plan gives access to comprehensive medication and health tracking to optimize your results regardless of if you're seeing a JoinOmu provider.
                </p>
              </div>
              
              <div className="cards-container" style={{ display: 'flex', flexDirection: 'row', gap: '0', maxWidth: '769px', width: '769px', alignItems: 'center' }}>
                <Card 
                  className="left-card-desktop"
                  style={{ 
                    borderTop: '1px solid #e5e7eb', 
                    borderBottom: '1px solid #e5e7eb', 
                    borderLeft: '1px solid #e5e7eb', 
                    borderRight: 'none',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
                    backgroundColor: 'white', 
                    zIndex: '1',
                    width: '384.5px'
                  }}
                >
                  <CardContent style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ color: '#111827', fontSize: '18px', fontWeight: '600', lineHeight: '28px' }}>Tracking only</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'end', gap: '2px' }}>
                        <span style={{ color: '#111827', fontSize: '36px', fontWeight: '600', lineHeight: '40px' }}>$0</span>
                        <span style={{ color: '#6b7280', fontSize: '16px' }}>/month</span>
                      </div>
                      <Button variant="secondary">Select plan</Button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ color: '#111827', fontSize: '14px', fontWeight: '500' }}>What's included:</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Check style={{ height: '20px', width: '20px', color: '#171717' }} />
                        <p style={{ color: '#6b7280', fontSize: '14px', flex: '1' }}>
                          Comprehensive medication and health tracking to optimize your results
                        </p>
                        <Info style={{ height: '16px', width: '16px', color: '#6b7280', opacity: '0.7' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className="right-card-desktop"
                  style={{ 
                    border: '1px solid #e5e7eb', 
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
                    borderRadius: '14px', 
                    backgroundColor: 'white', 
                    zIndex: '2',
                    width: '384.5px'
                  }}
                >
                  <CardContent style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ color: '#171717', fontSize: '18px', fontWeight: '600', lineHeight: '28px' }}>Medication + Tracking</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'end', gap: '2px' }}>
                        <span style={{ color: '#111827', fontSize: '36px', fontWeight: '600', lineHeight: '40px' }}>$79</span>
                        <span style={{ color: '#6b7280', fontSize: '16px' }}>/month</span>
                      </div>
                      <Button>Select plan</Button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ color: '#111827', fontSize: '14px', fontWeight: '500' }}>Everything in Tracking only, plus:</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Check style={{ height: '20px', width: '20px', color: '#171717' }} />
                        <p style={{ color: '#6b7280', fontSize: '14px', flex: '1' }}>
                          Unlimited access to a licensed JoinOmu physician with treatment level expertise
                        </p>
                        <Info style={{ height: '16px', width: '16px', color: '#6b7280', opacity: '0.7' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Check style={{ height: '20px', width: '20px', color: '#171717' }} />
                        <p style={{ color: '#6b7280', fontSize: '14px', flex: '1' }}>
                          Access to prescription medications
                        </p>
                        <Info style={{ height: '16px', width: '16px', color: '#6b7280', opacity: '0.7' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Check style={{ height: '20px', width: '20px', color: '#171717' }} />
                        <p style={{ color: '#6b7280', fontSize: '14px', flex: '1' }}>
                          Regular check ins with your provider
                        </p>
                        <Info style={{ height: '16px', width: '16px', color: '#6b7280', opacity: '0.7' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Check style={{ height: '20px', width: '20px', color: '#171717' }} />
                        <p style={{ color: '#6b7280', fontSize: '14px', flex: '1' }}>
                          On demand dosage adjustments
                        </p>
                        <Info style={{ height: '16px', width: '16px', color: '#6b7280', opacity: '0.7' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Check style={{ height: '20px', width: '20px', color: '#171717' }} />
                        <p style={{ color: '#6b7280', fontSize: '14px', flex: '1' }}>
                          Access to 24/7 messaging with your care team
                        </p>
                        <Info style={{ height: '16px', width: '16px', color: '#6b7280', opacity: '0.7' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}