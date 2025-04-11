import React from 'react';
import { format } from 'date-fns';
import { AttendanceWithUser } from '@shared/schema';
import { formatTime } from '../../utils/date';
import { getAttendanceStatusColor, getAttendanceStatusLabel } from '../../utils/attendance';

interface AttendanceTableProps {
  data: AttendanceWithUser[];
  isLoading: boolean;
  selectedDate: Date;
  period?: 'day' | 'week' | 'month';
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  data,
  isLoading,
  selectedDate,
  period = 'day'
}) => {
  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(end.getDate() + (6 - end.getDay()));
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      default:
        break;
    }

    return { start, end };
  };

  const { start, end } = getDateRange();

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const { bg, text } = getAttendanceStatusColor(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {getAttendanceStatusLabel(status)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No activity records found for the selected period</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check In
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check Out
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record) => (
            <tr key={record.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.user.employeeId || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(record.date), 'MMM dd, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.checkInTime ? formatTime(new Date(record.checkInTime)) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.checkOutTime ? formatTime(new Date(record.checkOutTime)) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={record.status || 'unknown'} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.checkInMethod || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
