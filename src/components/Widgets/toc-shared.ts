import type { MarkdownHeading } from 'astro'

export interface TocSeriesItem {
  title: string
  href: string
  date: string
  isCurrent: boolean
}

export interface TocPanelProps {
  filteredHeadings: MarkdownHeading[]
  seriesItems: TocSeriesItem[]
  currentUI: {
    toc: string
    series: string
  }
  hasToc: boolean
  hasSeries: boolean
}
