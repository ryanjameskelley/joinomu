import { PatientTreatments, type MonthlyHistory } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface PatientTreatmentsPageProps {
  treatmentType?: string
}

export function PatientTreatmentsPage({ treatmentType = "Weight Loss" }: PatientTreatmentsPageProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigate = (itemOrUrl: string) => {
    console.log('Navigation clicked:', itemOrUrl)
    // Handle both item names and URLs
    if (itemOrUrl.startsWith('/')) {
      // It's a URL, navigate directly
      navigate(itemOrUrl)
    } else {
      // It's an item name, handle accordingly
      switch (itemOrUrl) {
        case 'Dashboard':
          navigate('/dashboard')
          break
        case 'Treatments':
          navigate('/treatments')
          break
        case 'WeightLoss':
          navigate('/treatments/weightloss')
          break
        case 'Mens Health':
          navigate('/treatments/mens-health')
          break
        case 'Messaging':
          navigate('/messaging')
          break
        default:
          console.log('Unknown navigation item:', itemOrUrl)
      }
    }
  }

  // Extract user data for the treatments page
  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || ''
  } : undefined

  // Sample treatment data - in real app this would come from database
  const getTreatmentData = (type: string) => {
    if (type === "Mens Health" || type === "Men's Health") {
      return {
        nextShot: {
          medication: "Testosterone Cypionate",
          dosage: "200 mg",
          day: "Friday",
          time: "10:00 AM"
        },
        history: [
          {
            month: "December 2024",
            items: [
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Friday",
                time: "10:00 AM"
              },
              {
                medication: "Testosterone Cypionate", 
                dosage: "200 mg",
                date: "Monday",
                time: "2:30 PM"
              }
            ]
          },
          {
            month: "November 2024",
            items: [
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Thursday",
                time: "9:00 AM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg", 
                date: "Monday",
                time: "11:15 AM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Friday",
                time: "3:45 PM"
              }
            ]
          },
          {
            month: "October 2024",
            items: [
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Tuesday",
                time: "8:30 AM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Saturday",
                time: "1:00 PM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Wednesday",
                time: "4:20 PM"
              }
            ]
          }
        ]
      }
    }
    
    // Default: Weight Loss treatment
    return {
      nextShot: {
        medication: "Semaglutide (Ozempic)",
        dosage: "0.5 mg",
        day: "Monday",
        time: "8:00 AM"
      },
      history: [
        {
          month: "December 2024",
          items: [
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.5 mg",
              date: "Wednesday",
              time: "6:00 PM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.5 mg",
              date: "Monday",
              time: "8:00 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.5 mg",
              date: "Friday",
              time: "7:30 AM"
            }
          ]
        },
        {
          month: "November 2024",
          items: [
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Wednesday",
              time: "6:00 PM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Monday",
              time: "8:00 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Friday",
              time: "7:30 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Tuesday",
              time: "9:15 AM"
            }
          ]
        },
        {
          month: "October 2024",
          items: [
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Saturday",
              time: "7:00 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Wednesday",
              time: "6:30 PM"
            }
          ]
        }
      ]
    }
  }

  const { nextShot, history } = getTreatmentData(treatmentType)

  return (
    <PatientTreatments 
      user={userData}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      nextShot={nextShot}
      history={history}
      treatmentType={treatmentType}
    />
  )
}