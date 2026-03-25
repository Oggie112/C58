import {Box, Card, Code, Text} from '@sanity/ui'
import ReactMarkdown from 'react-markdown'
import guideContent from '../../docs/cms-guide.md?raw'

export function CmsGuide() {
	return (
		<Card height="fill" overflow="auto">
			<Box paddingX={5} paddingY={6} style={{maxWidth: 760, margin: '0 auto'}}>
				<ReactMarkdown
					components={{
						h1: ({children}) => (
							<Box marginBottom={4}>
								<Text size={4} weight="bold">{children}</Text>
							</Box>
						),
						h2: ({children}) => (
							<Box marginTop={6} marginBottom={3}>
								<Text size={3} weight="semibold">{children}</Text>
							</Box>
						),
						h3: ({children}) => (
							<Box marginTop={5} marginBottom={2}>
								<Text size={2} weight="semibold">{children}</Text>
							</Box>
						),
						h4: ({children}) => (
							<Box marginTop={4} marginBottom={2}>
								<Text size={1} weight="semibold">{children}</Text>
							</Box>
						),
						p: ({children}) => (
							<Box marginBottom={3}>
								<Text size={1} muted>{children}</Text>
							</Box>
						),
						li: ({children}) => (
							<Box as="li" marginBottom={1}>
								<Text size={1} muted>{children}</Text>
							</Box>
						),
						code: ({children, className}) => {
							const isBlock = !!className
							return isBlock
								? <Box marginBottom={3}><Code size={1} language={className?.replace('language-', '')}>{String(children)}</Code></Box>
								: <Code size={0}>{String(children)}</Code>
						},
						blockquote: ({children}) => (
							<Card tone="caution" padding={3} marginBottom={3} radius={2} border>
								{children}
							</Card>
						),
						hr: () => <Box marginY={5} style={{borderTop: '1px solid var(--card-border-color)'}} />,
						table: ({children}) => (
							<Box marginBottom={4} style={{overflowX: 'auto'}}>
								<table style={{width: '100%', borderCollapse: 'collapse'}}>{children}</table>
							</Box>
						),
						th: ({children}) => (
							<th style={{textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid var(--card-border-color)', whiteSpace: 'nowrap'}}>
								<Text size={1} weight="semibold">{children}</Text>
							</th>
						),
						td: ({children}) => (
							<td style={{padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--card-border-color)', verticalAlign: 'top'}}>
								<Text size={1} muted>{children}</Text>
							</td>
						),
					}}
				>
					{guideContent}
				</ReactMarkdown>
			</Box>
		</Card>
	)
}
