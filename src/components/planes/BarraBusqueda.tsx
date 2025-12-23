import { SearchIcon } from 'lucide-react'
import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const InputSearchIconDemo = () => {
  const id = useId()

  return (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor={id}>Search input with icon and button</Label>
      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
          <SearchIcon className="size-4" />
          <span className="sr-only">Search</span>
        </div>
        <Input
          id={id}
          type="search"
          placeholder="Search..."
          className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
        />
      </div>
    </div>
  )
}

export default InputSearchIconDemo
