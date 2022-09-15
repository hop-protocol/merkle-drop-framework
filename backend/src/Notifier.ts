import { WebClient } from '@slack/web-api'
import { slackAuthToken, slackChannel, slackErrorChannel, slackInfoChannel, slackLogChannel, slackSuccessChannel, slackUsername, slackWarnChannel } from './config'

type MessageOptions = {
  channel: string
}

export abstract class INotifier {
  error (message: string) {}
  info (message: string) {}
  log (message: string) {}
  success (message: string) {}
  warn (message: string) {}
}

export class Notifier implements INotifier {
  client: WebClient
  channel: string
  label: string

  constructor (label = '') {
    if (!slackAuthToken) {
      return
    }
    this.client = new WebClient(slackAuthToken)
    this.channel = slackChannel! // eslint-disable-line
    this.label = label
  }

  async sendMessage (message: string, options: Partial<MessageOptions> = {}) {
    if (!this.client) {
      return
    }
    if (this.label) {
      message = `${this.label}\n${message}`
    }
    try {
      console.log('sending slack message:', message)
      await this.client.chat.postMessage({
        channel: options.channel ?? this.channel,
        text: message,
        username: slackUsername,
        icon_emoji: ':rabbit'
      })
    } catch (err) {
      console.error('notifier error:', err.message)
    }
  }

  async error (message: string, options: Partial<MessageOptions> = {}) {
    const icon = '❌'
    return await this.sendMessage(`${icon} ${message}`, {
      channel: options.channel ?? slackErrorChannel
    })
  }

  async info (message: string, options: Partial<MessageOptions> = {}) {
    const icon = 'ℹ️'
    return await this.sendMessage(`${icon} ${message}`, {
      channel: options.channel ?? slackInfoChannel
    })
  }

  async log (message: string, options: Partial<MessageOptions> = {}) {
    const icon = 'ℹ️'
    return await this.sendMessage(`${icon} ${message}`, {
      channel: options.channel ?? slackLogChannel
    })
  }

  async success (message: string, options: Partial<MessageOptions> = {}) {
    const icon = '✅'
    return await this.sendMessage(`${icon} ${message}`, {
      channel: options.channel ?? slackSuccessChannel
    })
  }

  async warn (message: string, options: Partial<MessageOptions> = {}) {
    const icon = '⚠️'
    return await this.sendMessage(`${icon} ${message}`, {
      channel: options.channel ?? slackWarnChannel
    })
  }
}
