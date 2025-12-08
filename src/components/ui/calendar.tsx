import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  description?: string;
}

export interface CalendarProps {
  events?: CalendarEvent[];
  variant?: 'month' | 'week' | 'day' | 'agenda';
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  headerHeight?: string;
  dayHeight?: string;
  eventHeight?: string;
  className?: string;
}

export function Calendar({
  events = [],
  variant = 'month',
  selectedDate = new Date(),
  onDateSelect,
  onEventClick,
  headerHeight = '60px',
  dayHeight = '100px',
  eventHeight = '24px',
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        events: []
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }

    // Next month days
    const remainingCells = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  };

  const monthDays = useMemo(() => getDaysInMonth(currentDate), [currentDate, events]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => (
    <div className="calendar-month">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 border-b border-neutral-200"
        style={{ height: headerHeight }}
      >
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-neutral-100 rounded"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-neutral-100 rounded"
        >
          ›
        </button>
        <button
          onClick={goToToday}
          className="ml-4 px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
        >
          Today
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-neutral-600 border-r border-neutral-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              'border-r border-b border-neutral-200 last:border-r-0 p-1 cursor-pointer hover:bg-neutral-50',
              {
                'bg-neutral-50': !day.isCurrentMonth,
                'bg-primary-50': day.date.toDateString() === selectedDate.toDateString(),
              }
            )}
            style={{ minHeight: dayHeight }}
            onClick={() => onDateSelect?.(day.date)}
          >
            <div className="text-sm text-neutral-900 mb-1">
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {day.events.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: event.color || '#4CAF50',
                    color: 'white',
                    height: eventHeight
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {day.events.length > 3 && (
                <div className="text-xs text-neutral-500">
                  +{day.events.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="calendar-week">
      <div className="text-center py-4">
        <h2 className="text-lg font-semibold">
          Week of {currentDate.toLocaleDateString()}
        </h2>
      </div>
      <div className="text-center text-neutral-600">
        Week view not fully implemented - showing month view
      </div>
      {renderMonthView()}
    </div>
  );

  const renderDayView = () => (
    <div className="calendar-day">
      <div className="text-center py-4">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString()}
        </h2>
      </div>
      <div className="text-center text-neutral-600">
        Day view not fully implemented - showing month view
      </div>
      {renderMonthView()}
    </div>
  );

  const renderAgendaView = () => (
    <div className="calendar-agenda">
      <div className="text-center py-4">
        <h2 className="text-lg font-semibold">
          Agenda - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </div>
      <div className="space-y-2 p-4">
        {events.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            No events scheduled
          </div>
        ) : (
          events
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map(event => (
              <div
                key={event.id}
                className="p-3 border border-neutral-200 rounded cursor-pointer hover:bg-neutral-50"
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{event.title}</h3>
                  <span
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: event.color || '#4CAF50', color: 'white' }}
                  >
                    {event.start.toLocaleDateString()}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderCalendar = () => {
    switch (variant) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className={cn('calendar border border-neutral-200 rounded-lg bg-white', className)}>
      {renderCalendar()}
    </div>
  );
}

export default Calendar;