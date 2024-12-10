import * as React from 'react';
import { Button, DropEvent, DropdownGroup, DropdownItem, DropdownList, Icon } from '@patternfly/react-core';
import { CloseIcon, ExpandIcon, OpenDrawerRightIcon, OutlinedWindowRestoreIcon } from '@patternfly/react-icons';
import {
  Chatbot,
  ChatbotAlert,
  ChatbotContent,
  ChatbotConversationHistoryNav,
  ChatbotDisplayMode,
  ChatbotFooter,
  ChatbotFootnote,
  ChatbotHeader,
  ChatbotHeaderActions,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderOptionsDropdown,
  ChatbotHeaderTitle,
  ChatbotToggle,
  ChatbotWelcomePrompt,
  Conversation,
  FileDetailsLabel,
  FileDropZone,
  Message,
  MessageBar,
  MessageBox,
  MessageProps,
} from '@patternfly/chatbot';
import PatternFlyAvatar from '@app/bgimages/patternfly_avatar.svg';
import UserAvatar from '@app/bgimages/user_avatar.svg';

interface ChatbotLayoutProps {
  conversations: { [key: string]: Conversation[] };
  messages: MessageProps[];
  setMessages: (messages: any) => void;
}

const footnoteProps = {
  label: 'Bot uses AI. Check for mistakes.',
  popover: {
    title: 'Verify accuracy',
    description: `While Bot strives for accuracy, there's always a possibility of errors. It's a good practice to verify critical information from reliable sources, especially if it's crucial for decision-making or actions.`,
    bannerImage: {
      src: 'https://cdn.dribbble.com/userupload/10651749/file/original-8a07b8e39d9e8bf002358c66fce1223e.gif',
      alt: 'Example image for footnote popover',
    },
  },
};

const quickResponseOneContent = `If you believe that you've come across a PatternFly bug, alert our team, so that we can resolve the issue. To report a bug, follow these steps:

1. View the documentation for the feature, to confirm that the behavior is not functioning as intended.
2. Search open issues in the patternfly and patternfly-react repositories to see if a related issue already exists.
If the bug is present in only the React implementation of PatternFly, create a bug issue in patternfly-react.
If the bug can be seen on both the React and HTML/CSS side, create a bug issue in patternfly.
3. Be sure to mention which project the bug was noticed in and if there is a deadline that the fix is needed for.
`;

const quickResponseThreeContent = `Design tokens are variables that store visual design attributes like color,  typography, and spacing. Tokens have a name and value that conveys their associated design style, making their purpose clear and recognizable.
PatternFly's tokens are set up as variables and styles within Figma, and are  available as CSS variables for development. Tokens are only available as part of the PatternFly 6 release, so make sure you [upgrade to PatternFly 6](https://www.patternfly.org/get-started/upgrade/) and/or [install our Figma library](https://www.patternfly.org/get-started/design/#figma-library) in order to take advantage of tokens. PatternFly 6 components, charts, and extensions are all built with tokens.`;

const sendContent = `It looks like you're experiencing a browser issue. please try the followowing: 
1. Restart the browser: Try quitting and reloading the browser to see if the problem persists.
2. Clear cache and cookies: Delete temporary data stored by your browser to resolve potential conflicts.
3. Update your browser: Check for and install any available updates to ensure you have the latest features and bug fixes
4. Disable extensions: Temporarily disable browser extensions to see if they are causing issues
5. Check internet connection: Verify that you have a stable internet connection`;

const ChatbotLayout: React.FunctionComponent<ChatbotLayoutProps> = ({ conversations, messages, setMessages }) => {
  const [isChatbotVisible, setIsChatbotVisible] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState(ChatbotDisplayMode.default);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState<string>();
  const [showWelcomePrompts, setShowWelcomePrompts] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [file, setFile] = React.useState<File>();
  const [isLoadingFile, setIsLoadingFile] = React.useState<boolean>(false);
  const [filteredConversations, setFilteredConversations] = React.useState<{ [key: string]: Conversation[] }>(
    conversations,
  );
  const [value, setValue] = React.useState('');
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const chatbotRef = React.useRef<HTMLDivElement>(null);
  const historyRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const newConversations: { [key: string]: Conversation[] } = findMatchingItems(value);
    setFilteredConversations(newConversations);
  }, [conversations]);

  const setConversation = (id) => {
    setShowWelcomePrompts(false);

    const matchingConvo = Object.entries(conversations).flatMap(([key, conversations]) =>
      conversations.filter((conversation) => conversation.id === id).map((conversation) => ({ key, conversation })),
    )[0];

    const getMatchingConvoDate = () => {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      switch (matchingConvo.key) {
        case 'This month':
          return new Date(`${month} 1 ${year}`);
        case 'March':
          return new Date(`March 1 ${year}`);
        case 'February':
          return new Date(`February 1 ${year}`);
        case 'January':
          return new Date(`January 1 ${year}`);
        default:
          return new Date();
      }
    };
    const date = getMatchingConvoDate();
    const newMessage = {
      id: generateId(),
      role: 'user',
      avatar: UserAvatar,
      content: matchingConvo.conversation.text,
      timestamp: date.toLocaleString(),
    };
    setMessages([newMessage]);
    scrollToBottom();
    // make announcement to assistive devices that new message has loaded
    setAnnouncement(`Message from Bot: ${newMessage.content}`);
  };

  // you will likely want to come up with your own unique id function; this is for demo purposes only
  const generateId = () => {
    const id = Date.now() + Math.random();
    return id.toString();
  };

  const sendUserMessage = React.useCallback((newUserMessage) => {
    setMessages((prevMessages: MessageProps[]) => [...prevMessages, newUserMessage]);
    scrollToBottom();
    // make announcement to assistive devices that new message has loaded
    setAnnouncement(`Message from Bot: ${newUserMessage.content}`);
  }, []);

  const sendBotMessage = async (newBotMessage) => {
    // we can't use structuredClone since messages contains functions, but we can't mutate
    // items that are going into state or the UI won't update correctly
    const newMessages: MessageProps[] = [];
    // messages.forEach((message) => newMessages.push(message));
    newMessages.push({
      id: generateId(),
      role: 'bot',
      name: 'Bot',
      avatar: PatternFlyAvatar,
      content: '',
      isLoading: true,
    });
    // make announcement to assistive devices that new message has loaded
    setAnnouncement(`Message from Bot is loading`);
    setMessages((prevMessages: MessageProps[]) => [...prevMessages, ...newMessages]);
    await setTimeout(() => {
      setMessages((prevMessages: MessageProps[]) => {
        const newPrevMessages = [...prevMessages];
        console.log('////');
        newPrevMessages.pop();
        console.log(newPrevMessages);
        console.log(newBotMessage);
        return [...newPrevMessages, newBotMessage];
      });
      scrollToBottom();
      // make announcement to assistive devices that new message has loaded
      setAnnouncement(`Message from Bot: ${newBotMessage.content}`);
    }, 500);
  };

  const sendMessagePair = async (newUserMessage, newBotMessage) => {
    const newMessages: MessageProps[] = [];
    newMessages.push(newUserMessage);
    // make announcement to assistive devices that new message has loaded
    setAnnouncement(`Message from User: ${newUserMessage.content}`);
    newMessages.push({
      id: generateId(),
      role: 'bot',
      name: 'Bot',
      avatar: PatternFlyAvatar,
      content: '',
      isLoading: true,
    });
    // make announcement to assistive devices that new message has loaded
    setAnnouncement(`Message from Bot is loading`);
    setMessages((prevMessages: MessageProps[]) => {
      return [...prevMessages, ...newMessages];
    });
    scrollToBottom();
    await setTimeout(() => {
      setMessages((prevMessages) => {
        const newPrevMessages = [...prevMessages];
        newPrevMessages.pop();
        return [...newPrevMessages, newBotMessage];
      });
      // make announcement to assistive devices that new message has loaded
      setAnnouncement(`Message from Bot: ${newBotMessage.content}`);
      scrollToBottom();
    }, 500);
  };

  const getDate = () => {
    const date = new Date();
    return date.toLocaleString();
  };

  const onQuickResponseOneClick = async () => {
    const date = new Date();
    await sendMessagePair(
      {
        id: generateId(),
        content: 'Help me file a bug',
        role: 'user',
        avatar: UserAvatar,
        avatarProps: { isBordered: true },
        timestamp: date.toLocaleString(),
      },
      {
        id: generateId(),
        role: 'bot',
        name: 'Bot',
        avatar: PatternFlyAvatar,
        content: quickResponseOneContent,
        timestamp: date.toLocaleString(),
        actions: {
          // eslint-disable-next-line no-console
          positive: {
            onClick: () => {
              const response = {
                id: generateId(),
                content: 'Thanks for your feedback. Your response was recorded.',
                role: 'bot',
                name: 'Bot',
                avatar: PatternFlyAvatar,
                timestamp: getDate(),
              };
              sendBotMessage(response);
            },
          },
          // eslint-disable-next-line no-console
          negative: {
            onClick: () => {
              const response = {
                id: generateId(),
                content: 'Thanks for your feedback. Your response was recorded.',
                role: 'bot',
                name: 'Bot',
                avatar: PatternFlyAvatar,
                timestamp: getDate(),
              };
              sendBotMessage(response);
            },
          },
        },
      },
    );
  };

  const onQuickResponseTwoClick = async () => {
    const date = new Date();
    await sendMessagePair(
      {
        id: generateId(),
        content: 'What is PatternFly?',
        role: 'user',
        avatar: UserAvatar,
        avatarProps: { isBordered: true },
        timestamp: date.toLocaleString(),
      },
      {
        id: generateId(),
        role: 'bot',
        name: 'Bot',
        avatar: PatternFlyAvatar,
        content:
          'PatternFly is an open source design system that enables designers and  developers to create consistent and usable software products.',
        sources: {
          sources: [
            {
              title: 'Getting started with PatternFly',
              link: 'https://www.patternfly.org/get-started/about-patternfly',
              body: 'At the core of PatternFly is our global community of designers, developers, and other UX professionals with a passion for open source—in other words, our Flyers.',
            },
          ],
        },
        timestamp: date.toLocaleString(),
      },
    );
  };

  const onQuickResponseThreeClick = async () => {
    const date = new Date();
    await sendMessagePair(
      {
        id: generateId(),
        content: 'What are design tokens?',
        role: 'user',
        avatar: UserAvatar,
        avatarProps: { isBordered: true },
        timestamp: date.toLocaleString(),
      },
      {
        id: generateId(),
        role: 'bot',
        name: 'Bot',
        avatar: PatternFlyAvatar,
        content: quickResponseThreeContent,
        timestamp: date.toLocaleString(),
      },
    );
  };

  const onQuickResponseFourClick = async () => {
    const date = new Date();
    await sendMessagePair(
      {
        id: generateId(),
        content: 'Red Hatter Help Request',
        role: 'user',
        avatar: UserAvatar,
        avatarProps: { isBordered: true },
        timestamp: date.toLocaleString(),
      },
      {
        id: generateId(),
        content: `Navigate to the Red Hatter Help Desk and locate the [Support Services](https://redhat.service-now.com/help?id=rh_service_catalog) page. You will find a catalog of popular requests with the ability to file a request for your browser or laptop issue.`,
        role: 'bot',
        name: 'Bot',
        avatar: PatternFlyAvatar,
        sources: {
          sources: [
            {
              title: 'Red Hatter Help',
              link: 'https://redhat.service-now.com/help',
              body: (
                <>
                  <a href="https://redhat.service-now.com/help">Red Hatter Help</a> is your go-to place to get the help
                  you need, whenever and wherever you need it. It is a self-service support portal, powered by
                  ServiceNow where you can seek support from Red Hat’s internal business units.
                </>
              ),
            },
            {
              title: 'PC Refresh',
              link: 'https://redhat.service-now.com/help?id=sc_cat_item&sys_id=32d3e91ab852310077ed3a6cb584d9df',
              body: 'Request an updated or replacement laptop.',
            },
          ],
        },
        timestamp: date.toLocaleString(),
      },
    );
  };

  const onQuickResponseFiveClick = async () => {
    const date = new Date();
    await sendBotMessage({
      role: 'bot',
      name: 'Bot',
      avatar: PatternFlyAvatar,
      content: 'Please upload an image of your issue',
      timestamp: date.toLocaleString(),
    });
  };

  const onTopicOneClick = async () => {
    const date = new Date();
    sendBotMessage({
      id: generateId(),
      content: 'Hi 👋 How can I help?',
      role: 'bot',
      name: 'Bot',
      avatar: PatternFlyAvatar,
      quickResponses: [
        {
          id: '1',
          content: 'Help me file a bug',
          onClick: () => onQuickResponseOneClick(),
        },
        { id: '2', content: 'What is PatternFly?', onClick: onQuickResponseTwoClick },
        { id: '3', content: 'What are design tokens?', onClick: onQuickResponseThreeClick },
      ],
      timestamp: date.toLocaleString(),
    });
    setShowWelcomePrompts(false);
  };

  const onTopicTwoClick = () => {
    const date = new Date();
    sendBotMessage({
      id: generateId(),
      content: 'Hi 👋 What seems to be the issue?',
      role: 'bot',
      name: 'Bot',
      avatar: PatternFlyAvatar,
      timestamp: date.toLocaleString(),
    });
    setShowWelcomePrompts(false);
  };

  const welcomePrompts = [
    {
      title: 'Topic 1',
      message: 'I need help with PatternFly',
      onClick: onTopicOneClick,
    },
    {
      title: 'Topic 2',
      message: 'I am having a browser issue',
      onClick: onTopicTwoClick,
    },
  ];

  const findMatchingItems = (targetValue: string) => {
    let filteredConversations = Object.entries(conversations).reduce((acc, [key, items]) => {
      const filteredItems = items.filter((item) => item.text.toLowerCase().includes(targetValue.toLowerCase()));
      if (filteredItems.length > 0) {
        acc[key] = filteredItems;
      }
      return acc;
    }, {});

    // append message if no items are found
    if (Object.keys(filteredConversations).length === 0) {
      filteredConversations = [{ id: '-1', noIcon: true, text: 'No results found' }];
    }
    return filteredConversations;
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (message: string) => {
    setShowWelcomePrompts(false);
    switch (message) {
      case 'My browser is not loading':
      case 'My browser is not loading.':
        await sendMessagePair(
          {
            id: generateId(),
            role: 'user',
            avatar: UserAvatar,
            avatarProps: { isBordered: true },
            content: message,
            timestamp: getDate(),
          },
          {
            id: generateId(),
            role: 'bot',
            name: 'Bot',
            avatar: PatternFlyAvatar,
            content: sendContent,
            timestamp: getDate(),
          },
        );
        break;
      case 'It’s not working. What else can I do?':
      case "It's not working. What else can I do?":
        await sendMessagePair(
          {
            id: generateId(),
            role: 'user',
            avatar: UserAvatar,
            avatarProps: { isBordered: true },
            content: message,
            timestamp: getDate(),
          },
          {
            id: generateId(),
            role: 'bot',
            name: 'Bot',
            avatar: PatternFlyAvatar,
            content: `Do you want to file a Red Hatter help request? Alternatively, upload an image of your issue.`,
            quickResponses: [
              {
                id: '4',
                content: 'Red Hatter Help Request',
                onClick: onQuickResponseFourClick,
              },
              { id: '5', content: 'Upload an image', onClick: onQuickResponseFiveClick },
            ],
            timestamp: getDate(),
          },
        );
        break;
      default:
        sendUserMessage({
          id: generateId(),
          role: 'user',
          avatar: UserAvatar,
          avatarProps: { isBordered: true },
          content: message,
          attachments: file ? [file] : undefined,
          timestamp: getDate(),
        });
        if (file) {
          setFile(undefined);
        }
    }
    scrollToBottom();
  };

  const onSelectDisplayMode = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    setDisplayMode(value as ChatbotDisplayMode);
  };

  // handle file drop/selection
  const handleFile = (fileArr: File[]) => {
    setIsLoadingFile(true);
    // any custom validation you may want
    if (fileArr.length > 1) {
      setFile(undefined);
      setError('Uploaded more than one file.');
      return;
    }
    // this is 25MB in bytes; size is in bytes
    if (fileArr[0].size > 25000000) {
      setFile(undefined);
      setError('File is larger than 25MB.');
      return;
    }

    setFile(fileArr[0]);
    setError(undefined);
    // this is just for demo purposes, to make the loading state really obvious
    setTimeout(() => {
      setIsLoadingFile(false);
    }, 1000);
  };

  const handleFileDrop = (event: DropEvent, data: File[]) => {
    handleFile(data);
  };

  const handleAttach = (data: File[]) => {
    handleFile(data);
  };

  const onClose = () => {
    setFile(undefined);
  };

  return (
    <>
      <Chatbot displayMode={displayMode} ref={chatbotRef} isVisible={isChatbotVisible}>
        <ChatbotConversationHistoryNav
          displayMode={displayMode}
          onDrawerToggle={() => {
            setIsDrawerOpen(!isDrawerOpen);
            setFilteredConversations(conversations);
          }}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          // eslint-disable-next-line no-console
          onSelectActiveItem={(e, selectedItem) => setConversation(selectedItem)}
          conversations={filteredConversations}
          onNewChat={() => {
            setIsDrawerOpen(!isDrawerOpen);
            setMessages([]);
            setFilteredConversations(conversations);
            setShowWelcomePrompts(true);
          }}
          handleTextInputChange={(value: string) => {
            if (value === '') {
              setFilteredConversations(conversations);
            }
            setValue(value);
            // this is where you would perform search on the items in the drawer
            // and update the state
            const newConversations: { [key: string]: Conversation[] } = findMatchingItems(value);
            setFilteredConversations(newConversations);
          }}
          drawerContent={
            <>
              <ChatbotHeader>
                <ChatbotHeaderMain>
                  <ChatbotHeaderMenu
                    ref={historyRef}
                    aria-expanded={isDrawerOpen}
                    onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)}
                  />
                  <ChatbotHeaderTitle displayMode={displayMode}></ChatbotHeaderTitle>
                </ChatbotHeaderMain>
                <ChatbotHeaderActions>
                  <ChatbotHeaderOptionsDropdown onSelect={onSelectDisplayMode}>
                    <DropdownGroup label="Display mode">
                      <DropdownList>
                        <DropdownItem
                          value={ChatbotDisplayMode.default}
                          key="switchDisplayOverlay"
                          icon={<OutlinedWindowRestoreIcon aria-hidden />}
                          isSelected={displayMode === ChatbotDisplayMode.default}
                        >
                          <span>Overlay</span>
                        </DropdownItem>
                        <DropdownItem
                          value={ChatbotDisplayMode.docked}
                          key="switchDisplayDock"
                          icon={<OpenDrawerRightIcon aria-hidden />}
                          isSelected={displayMode === ChatbotDisplayMode.docked}
                        >
                          <span>Dock to window</span>
                        </DropdownItem>
                        <DropdownItem
                          value={ChatbotDisplayMode.fullscreen}
                          key="switchDisplayFullscreen"
                          icon={<ExpandIcon aria-hidden />}
                          isSelected={displayMode === ChatbotDisplayMode.fullscreen}
                        >
                          <span>Fullscreen</span>
                        </DropdownItem>
                      </DropdownList>
                    </DropdownGroup>
                  </ChatbotHeaderOptionsDropdown>
                  <Button
                    className="pf-chatbot__button--toggle-menu"
                    variant="plain"
                    onClick={() => setIsChatbotVisible(!isChatbotVisible)}
                    aria-label="Close ChatBot"
                    icon={
                      <Icon size="xl" isInline>
                        <CloseIcon />
                      </Icon>
                    }
                  />
                </ChatbotHeaderActions>
              </ChatbotHeader>
              <FileDropZone onFileDrop={handleFileDrop} displayMode={displayMode}>
                <ChatbotContent>
                  {/* Update the announcement prop on MessageBox whenever a new message is sent
                 so that users of assistive devices receive sufficient context  */}
                  <MessageBox announcement={announcement}>
                    {error && (
                      <ChatbotAlert
                        variant="danger"
                        onClose={() => {
                          setError(undefined);
                        }}
                        title="File upload failed"
                      >
                        {error}
                      </ChatbotAlert>
                    )}
                    {showWelcomePrompts && (
                      <ChatbotWelcomePrompt
                        title="Hello, Chatbot User"
                        description="How may I help you today?"
                        prompts={welcomePrompts}
                      />
                    )}
                    {/* This code block enables scrolling to the top of the last message.
                  You can instead choose to move the div with scrollToBottomRef on it below 
                  the map of messages, so that users are forced to scroll to the bottom.
                  If you are using streaming, you will want to take a different approach; 
                  see: https://github.com/patternfly/chatbot/issues/201#issuecomment-2400725173 */}
                    {messages.map((message, index) => {
                      if (index === messages.length - 1) {
                        return (
                          <>
                            <div ref={scrollToBottomRef}></div>
                            <Message key={message.id} {...message} />
                          </>
                        );
                      }
                      return <Message key={message.id} {...message} />;
                    })}
                  </MessageBox>
                </ChatbotContent>
                <ChatbotFooter>
                  {file && (
                    <div>
                      <FileDetailsLabel fileName={file.name} isLoading={isLoadingFile} onClose={onClose} />
                    </div>
                  )}
                  <MessageBar
                    onSendMessage={handleSend}
                    hasMicrophoneButton
                    handleAttach={handleAttach}
                    alwayShowSendButton
                  />
                  <ChatbotFootnote {...footnoteProps} />
                </ChatbotFooter>
              </FileDropZone>
            </>
          }
        ></ChatbotConversationHistoryNav>
      </Chatbot>
      <ChatbotToggle
        tooltipLabel="ChatBot"
        isChatbotVisible={isChatbotVisible}
        onToggleChatbot={() => setIsChatbotVisible(!isChatbotVisible)}
        ref={toggleRef}
      />
    </>
  );
};

export { ChatbotLayout };
