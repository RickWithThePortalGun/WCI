# WCI System Architecture

```mermaid
flowchart TB
    %% Data Sources
    RSS[RSS News Feeds<br/>BBC, Al Jazeera, Reuters,<br/>Guardian, DW, RFI, France 24]
    YT[YouTube Channels<br/>BBC News, Al Jazeera,<br/>DW News, France 24, WION, TRT]
    
    %% API Routes
    NewsAPI[/api/news<br/>GET Request]
    YTAPI[/api/youtube<br/>GET Request]
    EscalationAPI[/api/escalation-score<br/>POST Request<br/>AI Scoring + Cache]
    
    %% Processing Pipeline
    ParseRSS[RSS Parser<br/>Extract Items]
    ParseYT[YouTube RSS Parser<br/>Extract Videos]
    
    %% Analysis Functions
    ClassifyTags[classifyTags<br/>Match keywords to<br/>conflict tags]
    ClassifyRegion[classifyRegion<br/>Map tags to regions]
    AnalyzeSentiment[analyzeSentiment<br/>Scan for positive/negative<br/>keywords]
    ComputeEscalation[computeEscalationScore<br/>Rule-based fallback<br/>Frequency + sentiment]
    AIScoring[AI Escalation Scoring<br/>GPT-4o-mini<br/>Cached 24h]
    
    %% Data Processing
    Dedupe[Deduplicate Articles<br/>By title similarity]
    Filter[Filter by Tag/Region<br/>if query params]
    Sort[Sort by Date]
    
    %% Frontend Components
    Dashboard[Dashboard Component<br/>Main Container]
    SWR[SWR Hooks<br/>Auto-refresh every 2-5min]
    
    %% UI Tabs
    TabDash[Dashboard Tab<br/>Multi-panel view]
    TabGlobe[Globe Tab<br/>3D visualization]
    TabNews[Intelligence Tab<br/>News feed]
    TabVideos[Video Tab<br/>YouTube clips]
    TabAnalysis[Analysis Tab<br/>Timeline & Triangulation]
    
    %% Display Components
    NewsFeed[NewsFeed Component<br/>Filterable article list]
    ArticleCard[ArticleCard<br/>Shows escalation score,<br/>sentiment, tags]
    VideoPanel[VideoPanel<br/>Grid of video thumbnails]
    ConflictGlobe[ConflictGlobe<br/>3D Globe with zones]
    EscalationChart[EscalationChart<br/>24H timeline]
    AIDigest[AIDigest<br/>AI summary widget]
    ConflictTimeline[ConflictTimeline<br/>Chronological events]
    SourceTriangulation[SourceTriangulation<br/>Multi-source analysis]
    
    %% Data Flow
    RSS --> NewsAPI
    YT --> YTAPI
    
    NewsAPI --> ParseRSS
    ParseRSS --> ClassifyTags
    ClassifyTags --> ClassifyRegion
    ClassifyTags --> AnalyzeSentiment
    
    AnalyzeSentiment --> EscalationAPI
    EscalationAPI -->|Cache Hit| ComputeEscalation
    EscalationAPI -->|Cache Miss| AIScoring
    AIScoring -->|Success| ComputeEscalation
    AIScoring -->|Error| ComputeEscalation
    
    ComputeEscalation --> Dedupe
    Dedupe --> Filter
    Filter --> Sort
    Sort --> NewsAPI
    
    YTAPI --> ParseYT
    ParseYT --> ClassifyTags
    ParseYT --> YTAPI
    
    NewsAPI --> SWR
    YTAPI --> SWR
    SWR --> Dashboard
    
    Dashboard --> TabDash
    Dashboard --> TabGlobe
    Dashboard --> TabNews
    Dashboard --> TabVideos
    Dashboard --> TabAnalysis
    
    TabDash --> NewsFeed
    TabDash --> ArticleCard
    TabDash --> ConflictGlobe
    TabDash --> EscalationChart
    TabDash --> AIDigest
    TabDash --> VideoPanel
    
    TabGlobe --> ConflictGlobe
    
    TabNews --> NewsFeed
    NewsFeed --> ArticleCard
    
    TabVideos --> VideoPanel
    
    TabAnalysis --> ConflictTimeline
    TabAnalysis --> SourceTriangulation
    TabAnalysis --> AIDigest
    
    %% Styling
    classDef api fill:#1a3a1a,stroke:#44aaff,stroke-width:2px,color:#8aaa8a
    classDef process fill:#0a1a0c,stroke:#ff4400,stroke-width:2px,color:#ff6633
    classDef ui fill:#060f07,stroke:#44ff88,stroke-width:2px,color:#aaccaa
    classDef data fill:#030805,stroke:#ffaa00,stroke-width:2px,color:#ffcc44
    
    class RSS,YT data
    class NewsAPI,YTAPI,EscalationAPI api
    class ParseRSS,ParseYT,ClassifyTags,ClassifyRegion,AnalyzeSentiment,ComputeEscalation,AIScoring,Dedupe,Filter,Sort process
    class Dashboard,SWR,TabDash,TabGlobe,TabNews,TabVideos,TabAnalysis,NewsFeed,ArticleCard,VideoPanel,ConflictGlobe,EscalationChart,AIDigest,ConflictTimeline,SourceTriangulation ui
```

## Escalation Score Calculation Flow

```mermaid
flowchart TD
    Start[Article Title + Description] --> CheckCache{Check Cache<br/>24h TTL}
    
    CheckCache -->|Cache Hit| CachedScore[Return Cached Score<br/>Instant]
    CheckCache -->|Cache Miss| HasAPIKey{OPENAI_API_KEY<br/>Configured?}
    
    HasAPIKey -->|Yes| AIScoring[GPT-4o-mini Analysis<br/>Context-aware scoring<br/>0.0-10.0]
    HasAPIKey -->|No| RuleBased[Rule-Based Scoring]
    
    AIScoring -->|Success| CacheResult[Cache Result<br/>24h TTL]
    AIScoring -->|Error/Timeout| RuleBased
    
    RuleBased --> Frequency[Count Keyword Frequency<br/>Title: 2x weight<br/>Description: 1x weight]
    Frequency --> CriticalPhrases[Check Critical Phrases<br/>nuclear war, genocide,<br/>mass casualty, etc.]
    CriticalPhrases --> HighWords[High Severity Words<br/>nuclear, missile, bomb,<br/>killed, attack, war, etc.<br/>+1.0 per title match<br/>+0.4 per desc match]
    HighWords --> MedWords[Medium Severity Words<br/>tension, military, clash,<br/>conflict, sanction, etc.<br/>+0.4 per title match<br/>+0.2 per desc match]
    MedWords --> DeEscalate[De-escalation Words<br/>diplomatic, talks,<br/>negotiation, etc.<br/>-0.3 per match]
    DeEscalate --> Sentiment[Integrate Sentiment<br/>Negative: +0.8<br/>Positive: -0.5]
    Sentiment --> Compound[Compound Bonus<br/>3+ high words: +0.8<br/>5+ high words: +1.3]
    Compound --> Clamp[Clamp to 0-10]
    
    CacheResult --> Clamp
    Clamp --> Round[Round to 1 decimal]
    Round --> FinalScore[Final Escalation Score<br/>0.0 - 10.0]
    CachedScore --> FinalScore
    
    style CheckCache fill:#44aaff,stroke:#66bbff,color:#fff
    style AIScoring fill:#ff4400,stroke:#ff6600,color:#fff
    style RuleBased fill:#ff8800,stroke:#ffaa00,color:#fff
    style FinalScore fill:#44ff88,stroke:#66ccaa,color:#030805
    style CacheResult fill:#44aaff,stroke:#66bbff,color:#fff
```

## Component Hierarchy

```mermaid
graph TD
    App[Next.js App] --> Layout[Layout Component]
    Layout --> Dashboard[Dashboard Component]
    
    Dashboard --> Header[Header Component<br/>Tab Navigation]
    Dashboard --> AlertTicker[AlertTicker<br/>Breaking News]
    Dashboard --> StatsBar[StatsBar<br/>KPI Metrics]
    Dashboard --> MainContent[Main Content Area]
    
    MainContent -->|Dashboard Tab| Grid[Grid Layout]
    Grid --> GlobePanel[Globe Panel<br/>ConflictGlobe]
    Grid --> ChartPanel[Chart Panel<br/>EscalationChart]
    Grid --> NewsPanel[News Panel<br/>NewsFeed]
    Grid --> AIPanel[AI Panel<br/>AIDigest]
    Grid --> VideoPanel[Video Panel<br/>VideoPanel]
    
    MainContent -->|Globe Tab| FullGlobe[Full Screen Globe]
    MainContent -->|Intelligence Tab| FullNews[Full News Feed]
    MainContent -->|Video Tab| FullVideos[Full Video Grid]
    MainContent -->|Analysis Tab| AnalysisGrid[Analysis Grid]
    AnalysisGrid --> TimelinePanel[Timeline Panel<br/>ConflictTimeline]
    AnalysisGrid --> TriangPanel[Triangulation Panel<br/>SourceTriangulation]
    AnalysisGrid --> AIPanel2[AI Digest Panel]
    
    NewsFeed --> ArticleCard
    VideoPanel --> VideoCard[Video Thumbnail Cards]
    
    style Dashboard fill:#1a3a1a,stroke:#ff4400,color:#ff6633
    style MainContent fill:#0a1a0c,stroke:#44aaff,color:#8aaa8a
```
