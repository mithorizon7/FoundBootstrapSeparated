# Phase 7: AI Voice Agent: Give Your Brand an Expert to Talk To

**Estimated Time:** 15 minutes

## Introduction

Websites and videos inform, but a **live voice interaction builds trust**.

This activity creates a **phone concierge** powered by **ElevenLabs' Call-API** that can answer customer questions using your curated knowledge base and brand personality.

Users can **call** a real number (or interact via website) and ask questions about your product to hear an **on-brand, fact-backed reply** that builds confidence and drives engagement.

## Form Fields

### Voice Agent Name
- **Label:** Voice Agent Name
- **Placeholder:** e.g., Alex, Sarah, Morgan
- **Help:** Choose a friendly name for your AI voice concierge
- **Tooltip:** Creates a personal connection with callers and establishes brand personality. Choose a name that feels approachable and matches your target audience's preferences and cultural context.
- **Required:** Yes

### Agent Persona & Role
- **Label:** Agent Persona & Role
- **Placeholder:** You are 'Alex', a friendly, knowledgeable, and patient product concierge for [Company Name]. Your specialty is providing clear information about our new [Concept Code] offering.
- **Help:** Define who the AI is, its function, and key characteristics
- **Tooltip:** Establishes the voice agent's personality and expertise level. This persona should align with your brand adjectives and target audience expectations while clearly defining the agent's role and capabilities.
- **Required:** Yes

### Environment & Context
- **Label:** Environment & Context
- **Placeholder:** You are interacting with users over the phone or on the website. The user is typically a parent interested in [Concept Code]. They may be curious, potentially cautious, or sometimes multitasking.
- **Help:** Describe the communication channel and likely user context
- **Tooltip:** Helps the AI understand caller circumstances and adapt its communication style. Mentioning that users might be multitasking or cautious helps the agent be more patient and clear in responses.
- **Required:** Yes

### Knowledge Source Handling
- **Label:** Knowledge Source Handling
- **Help:** Choose how strictly the AI uses your provided sources vs. general knowledge
- **Tooltip:** Strict control ensures all answers come from your verified research, ideal for regulated industries. Flexible allows broader helpfulness but may introduce unverified information beyond your brand knowledge.
- **Required:** Yes
- **Options:**
  - Strict Control - Only use provided knowledge base
  - Prioritized Flexibility - Use knowledge base first, supplement when needed

### Boundaries & Safety Rules
- **Label:** Boundaries & Safety Rules
- **Placeholder:** Never speculate or invent answers. Do not provide medical, legal, or financial advice. Avoid discussing competitors.
- **Help:** Define prohibited actions and safety constraints
- **Tooltip:** Protects your brand reputation by preventing the agent from making claims it can't support or venturing into liability areas. Essential for maintaining trust and avoiding regulatory issues.
- **Required:** Yes

### Company Name
- **Label:** Company Name
- **Placeholder:** e.g., PlayTech Innovations
- **Help:** Your company or brand name
- **Tooltip:** This will be used in the agent's persona and responses to establish brand identity and context for customer interactions.
- **Required:** Yes

### Product/Service Name
- **Label:** Product/Service Name
- **Placeholder:** e.g., SMART PLAY BLOCKS
- **Help:** The name of your main product or service offering
- **Tooltip:** The specific product/service the voice agent will be answering questions about. Should match your hero concept or main offering.
- **Required:** Yes

### Brand Adjective 1
- **Label:** Brand Adjective 1
- **Placeholder:** e.g., friendly
- **Help:** First key personality trait for your brand voice
- **Tooltip:** Primary personality trait that defines how your voice agent should sound. This will directly influence the agent's tone and communication style.
- **Required:** Yes

### Brand Adjective 2
- **Label:** Brand Adjective 2
- **Placeholder:** e.g., knowledgeable
- **Help:** Second key personality trait for your brand voice
- **Tooltip:** Secondary personality trait that complements the first. Together these adjectives create your unique brand voice personality.
- **Required:** Yes

### Brand Adjective 3
- **Label:** Brand Adjective 3
- **Placeholder:** e.g., trustworthy
- **Help:** Third key personality trait for your brand voice
- **Tooltip:** Third personality trait that rounds out your brand voice. These three adjectives will be explicitly programmed into your AI agent's responses.
- **Required:** Yes

## Decision Box Content

### Title: Crafting Your Optimal ElevenLabs Voice Agent Prompt
**Subtitle:** Configure the ElevenLabs Conversational AI to act as a trustworthy, helpful, and on-brand voice concierge

#### Section 1: Define the AI's Persona & Role

**Be Specific**
Clearly state who the AI is, its name (optional but recommended), its function, and its key characteristics relevant to the interaction. Connect traits to the role.

**Example Approach**
"You are 'Alex', a friendly, knowledgeable, and patient product concierge for {{company_name}}. Your specialty is providing clear information about our {{concept_name}} offering."

#### Section 2: Set the Environment & Context

**Inform the AI**
Briefly tell the AI about the communication channel and the likely user context. This helps it adjust style and empathy.

**Example Approach**
"You are interacting with users over the phone or on the website. The user is typically interested in {{concept_name}}. They may be curious, potentially cautious, or sometimes multitasking. Adapt your responses to be clear, concise, and reassuring in this context."

#### Section 3: Establish Conversational Style & Tone

**Use Brand Adjectives**
Explicitly incorporate your three brand adjectives ({{brand_adj_1}}, {{brand_adj_2}}, {{brand_adj_3}}) to define the core personality.

**Add Naturalness**
Instruct the AI to use subtle conversational elements to sound less robotic. Example: "Your tone must always be {{brand_adj_1}}, {{brand_adj_2}}, and {{brand_adj_3}}. To sound natural and engaging, occasionally use brief, appropriate affirmations like 'Okay,' 'Got it,' or 'I understand'."

#### Section 4: Knowledge Source Handling (Critical Choice)

**Option A: Strict Control**
**Best for:** Ensuring only approved information is shared, preventing speculation, high-stakes accuracy needs.
**Trade-off:** AI cannot answer questions outside the provided sources, potentially frustrating users seeking broader info.

**Option B: Prioritized Flexibility**
**Best for:** Allowing the AI to answer a wider range of questions when vetted info is unavailable, potentially improving user satisfaction.
**Trade-off:** Requires trusting the AI's judgment; necessitates clear instruction on how to use external knowledge. Less message control.

#### Section 5: Establish Boundaries & Rules

**Define "Don'ts"**
Clearly list prohibited actions to reinforce constraints. Tailor slightly based on your choice in Knowledge Source Handling.

**Safety Net**
Example: "Never speculate or invent answers or details not present in your sources. Do not provide medical, legal, financial, or any other form of professional advice. Avoid discussing competitors or topics unrelated to {{company_name}} and {{concept_name}}."

### Action: Complete the Configuration
- Define your AI agent's name and persona
- Set the conversation environment and context
- Choose knowledge source handling approach (strict vs. flexible)
- Establish clear boundaries and safety rules
- Test with key anticipated questions and refine

## Step-by-Step Flow

### Step 1: Setup ElevenLabs Agent
**Action:** Setup ElevenLabs Agent - Go to ElevenLabs → "Conversational AI" → "New Agent"

#### Details: Create Your Voice Agent Foundation
1. In ElevenLabs go to "**Conversational AI**" and select "**New Agent**"
2. Pick an **agent name** and select "**Blank Template**"
3. You'll see a configuration interface with several important fields to fill out

### Step 2: Configure Agent Settings
**Action:** Configure Agent Settings - Fill in First Message and System Prompt

#### Details: Configure Core Agent Behavior
1. Fill in the **First Message** - This is what users hear when they first connect. **TIP:** Make this greeting warm and professional, introducing the agent by name and explaining how they can help.
2. Fill in the **System Prompt** - Use the comprehensive prompt template from the Prompt Preview section below, with all your form field values filled in
3. Review other settings but focus on these two most important fields first

### Step 3: Upload Knowledge Base
**Action:** Upload Knowledge Base - Add your documents as the agent's information source

#### Details: Connect Your Information Sources
1. Near the bottom of the configuration, find the "**Knowledge Base**" section
2. Upload any research documents, product information, or supporting materials about your {{concept_name}} (provides verified knowledge base)
3. Upload additional materials like concept briefs, FAQs, or detailed product information (can be offered as a "want to learn more?" option)
4. Wait for the documents to process and be indexed by the system

### Step 4: Test the Voice Agent
**Action:** Test the Voice Agent - Verify behavior and make refinements

#### Details: Test and Refine Agent Performance
1. **Test the AI agent** with key anticipated questions (this is fun!). Try questions like: "Is {{concept_name}} safe for five-year-olds?" or "How does {{concept_name}} work?"
2. **Listen carefully** to the responses. Check if the agent uses your brand adjectives and stays within knowledge boundaries
3. **Make adjustments** to the System Prompt based on performance, refining wording until the agent behaves as desired
4. **Test multiple scenarios** to ensure consistent, on-brand responses

### Step 5: Get Widget Code
**Action:** Get Widget Code - Copy embed code for website integration

#### Details: Integrate Agent into Your Website
1. At the top of the ElevenLabs interface, click "**Widget**"
2. **Copy the embed code** somewhere handy (save it in a text file)
3. This code can be embedded into your website to provide live voice interaction
4. Test the widget to ensure it connects properly and maintains agent behavior

## Expected Output

**File Created:** ElevenLabs widget embed code, configured voice agent

**Why It Matters:** Live voice interaction builds trust beyond static websites and videos. Users can ask specific questions and get on-brand, fact-backed replies that demonstrate your expertise and build confidence in your product.

**Next Steps:** Your voice agent is ready to be integrated into your website as a "Talk to an Expert" feature, providing 24/7 customer support powered by your curated knowledge base.

## AI Prompt Template

**ELEVENLABS VOICE AGENT SYSTEM PROMPT**

**AI PERSONA & ROLE:**
{{agent_persona}}

**ENVIRONMENT & CONTEXT:**
{{conversation_context}}

**CONVERSATIONAL STYLE & TONE:**
Your tone must always be {{brand_adj_1}}, {{brand_adj_2}}, and {{brand_adj_3}}. To sound natural and engaging, occasionally use brief, appropriate affirmations like 'Okay,' 'Got it,' or 'I understand'. Use natural pauses for clarity, especially when explaining steps if necessary. Speak clearly and avoid overly technical jargon.

**CORE GOAL & OBJECTIVE:**
Your primary goal is to help users by accurately and concisely answering their questions about {{concept_name}}'s features, benefits, usage, and safety, based primarily on the provided information sources, ensuring they feel informed and confident.

**KNOWLEDGE SOURCE HANDLING:**
{{#if knowledge_source_handling == 'strict'}}
You MUST base all your answers strictly and solely on the information provided in the connected knowledge base (from Notebook LM). Do not use any external websites, general knowledge, or make assumptions beyond the provided text. If the answer to a user's question is not found in the provided knowledge base, clearly state that you do not have that specific information available and cannot answer.
{{else}}
Strongly prioritize using ONLY the information within the connected knowledge base (from Notebook LM) for your answers. If, and only if, the provided knowledge base does not contain the information needed to answer a direct user question about {{concept_name}} or closely related context, you may carefully supplement with your broader knowledge. When doing so, you must explicitly state you are using general information (e.g., 'Based on general knowledge outside the provided materials...').
{{/if}}

**BOUNDARIES & RULES:**
{{boundaries_rules}} Regardless of knowledge source handling: Never speculate or invent answers or details not present in your sources. Do not provide medical, legal, financial, or any other form of professional advice. Avoid discussing competitors or topics unrelated to {{company_name}} and {{concept_name}}. If a question is outside your scope or knowledge base, politely state you cannot help with that specific query.