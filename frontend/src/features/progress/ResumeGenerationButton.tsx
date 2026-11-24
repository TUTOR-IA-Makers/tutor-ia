import { Play } from 'lucide-react'
import { Button } from '@/components/ui'
import { useResumeGeneration } from '@/features/questions'

export interface ResumeGenerationButtonProps {
  questionId: string
  block?: boolean
  disabled?: boolean
}

export function ResumeGenerationButton({
  questionId,
  block = false,
  disabled = false,
}: ResumeGenerationButtonProps) {
  const resume = useResumeGeneration(questionId)
  return (
    <Button
      variant="accent"
      size="lg"
      block={block}
      icon={Play}
      isLoading={resume.isPending}
      disabled={disabled}
      onClick={() => {
        resume.mutate()
      }}
    >
      Retomar geração
    </Button>
  )
}
