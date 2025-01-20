import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const HelpTour = ({ onClose }) => {
  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '.logo',
          popover: {
            title: 'Welcome!',
            description: 'Click here anytime to return to the dashboard.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '[data-tour="jobs"]',
          popover: {
            title: 'Job Matches',
            description: 'View and manage your job matches. Our AI helps find the best opportunities for you.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '[data-tour="applications"]',
          popover: {
            title: 'Applications Tracking',
            description: 'Track all your job applications in one place. Never miss an update!',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '[data-tour="preferences"]',
          popover: {
            title: 'Preferences',
            description: 'Set your job preferences to get better matches. Include your skills, experience, and desired locations.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '.notifications',
          popover: {
            title: 'Notifications',
            description: 'Stay updated with real-time notifications about your applications and new job matches.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '.profile-menu',
          popover: {
            title: 'Profile Settings',
            description: 'Manage your account settings, subscription, and profile information here.',
            side: "bottom",
            align: 'end'
          }
        }
      ],
      onDestroyed: () => {
        onClose?.();
      }
    });

    driverObj.drive();

    return () => {
      driverObj.destroy();
    };
  }, [onClose]);

  return null;
};

export default HelpTour; 