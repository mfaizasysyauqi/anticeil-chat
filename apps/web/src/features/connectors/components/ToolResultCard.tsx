'use client';

import React from 'react';
import {
  Mail,
  Calendar,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Video,
  Send,
  Trash2,
  FileText,
  ExternalLink,
  ChevronRight,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { ToolCallResult, GmailMessage, CalendarEvent, DriveFile, getTranslation } from '@chatbyok/core';
import { ConnectorBrandIcon } from './ConnectorLogos';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface ToolResultCardProps {
  result: ToolCallResult;
}

export function ToolResultCard({ result }: ToolResultCardProps) {
  const { toolName, connectorId, status, data, error, summary } = result;
  const isSuccess = status === 'success';
  const language = useSettingsStore((s) => s.language);
  const tc = getTranslation(language).connectors;

  return (
    <div
      style={{
        margin: '10px 0',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-strong)',
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        fontSize: '13px',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ConnectorBrandIcon id={connectorId} size={17} />
          </div>

          <span
            style={{
              fontWeight: 700,
              fontSize: '11px',
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {toolName.replace(/_/g, ' ')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isSuccess ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-success-subtle, rgba(16, 185, 129, 0.15))',
                color: 'var(--accent-success)',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={12} />
              {tc.actionExecuted}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--accent-danger)',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={12} />
              {tc.actionFailed}
            </span>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Error notice */}
        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--accent-danger)',
              fontSize: '12px',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Gmail: List Messages */}
        {toolName === 'gmail_list_messages' && data?.messages && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {summary || `Found ${data.messages.length} email(s)`}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {data.messages.map((msg: GmailMessage) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                      {msg.from.split('<')[0].replace(/"/g, '') || msg.from}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                    {msg.subject || '(No Subject)'}
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {msg.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gmail: Send / Draft Message */}
        {(toolName === 'gmail_send_message' || toolName === 'gmail_create_draft') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backgroundColor: 'var(--accent-success-subtle, rgba(16, 185, 129, 0.08))',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {toolName === 'gmail_send_message' ? <Send size={15} /> : <FileText size={15} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                {toolName === 'gmail_send_message' ? tc.emailSent : tc.draftSaved}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {summary}
              </p>
            </div>
          </div>
        )}

        {/* Calendar: List Events */}
        {toolName === 'calendar_list_events' && data?.events && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {summary || `Found ${data.events.length} event(s)`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.events.map((evt: CalendarEvent) => {
                const start = evt.start.dateTime ? new Date(evt.start.dateTime) : null;
                const end = evt.end.dateTime ? new Date(evt.end.dateTime) : null;

                return (
                  <div
                    key={evt.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-main)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {evt.summary}
                      </span>
                      {evt.meetLink && (
                        <a
                          href={evt.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Video size={12} />
                          <span>{tc.meet}</span>
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {start && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {end && ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      )}
                      {evt.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          {evt.location}
                        </span>
                      )}
                      {evt.attendees && evt.attendees.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} />
                          {evt.attendees.length} {tc.attendees}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar: Create / Update Event */}
        {(toolName === 'calendar_create_event' || toolName === 'calendar_update_event') && data?.event && (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                    }}
                  />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    {data.event.summary}
                  </span>
                </div>
                {data.event.description && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {data.event.description}
                  </p>
                )}
              </div>

              {data.event.htmlLink && (
                <a
                  href={data.event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>{tc.openCalendar}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid rgba(59, 130, 246, 0.15)', paddingTop: '10px', fontSize: '11px' }}>
              {data.event.start.dateTime && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                >
                  <Clock size={12} color="#3b82f6" />
                  {new Date(data.event.start.dateTime).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              {data.event.location && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <MapPin size={12} />
                  {data.event.location}
                </span>
              )}
              {data.event.attendees && data.event.attendees.length > 0 && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Users size={12} />
                  {data.event.attendees.map((a: any) => a.email).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Google Drive: List Files */}
        {toolName === 'drive_list_files' && data?.files && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {summary || `Found ${data.files.length} file(s) in Google Drive`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.files.map((file: DriveFile) => (
                <div
                  key={file.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? (
                        <FileSpreadsheet size={15} />
                      ) : file.name.endsWith('.md') || file.name.endsWith('.ts') ? (
                        <FileCode size={15} />
                      ) : (
                        <FileText size={15} />
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {file.mimeType} • {new Date(file.modifiedTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                    >
                      <span>{tc.view}</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Drive: Create / Update File */}
        {(toolName === 'drive_create_file' || toolName === 'drive_update_file') && data?.file && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FolderOpen size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                {toolName === 'drive_create_file' ? tc.fileCreated : tc.fileUpdated}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                📄 <strong>{data.file.name}</strong>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                {summary}
              </p>
            </div>
          </div>
        )}

        {/* Delete actions (Gmail, Calendar, Drive) */}
        {(toolName === 'gmail_trash_message' || toolName === 'calendar_delete_event' || toolName === 'drive_delete_file') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            <Trash2 size={14} color="var(--accent-danger)" />
            <span>{summary}</span>
          </div>
        )}

        {/* General Summary for other tools */}
        {!['gmail_list_messages', 'calendar_list_events', 'calendar_create_event', 'calendar_update_event', 'drive_list_files', 'drive_create_file', 'drive_update_file'].includes(toolName) && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
