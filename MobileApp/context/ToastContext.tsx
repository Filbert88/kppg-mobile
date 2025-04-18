"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native"

// Toast types
export type ToastType = "success" | "error" | "info" | "warning"

// Toast position
export type ToastPosition = "top" | "bottom"

// Toast data structure
export interface ToastData {
  id: string
  message: string
  type: ToastType
  duration?: number
  position?: ToastPosition
}

// Context interface
interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number, position?: ToastPosition) => void
  hideToast: (id: string) => void
}

// Create context
const ToastContext = createContext<ToastContextProps | undefined>(undefined)

// Toast provider props
interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  // Show toast function
  const showToast = (message: string, type: ToastType = "info", duration = 3000, position: ToastPosition = "top") => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration, position }])

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }

  // Hide toast function
  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Render toasts */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </ToastContext.Provider>
  )
}

// Toast component props
interface ToastProps {
  toast: ToastData
  onClose: () => void
}

// Toast component
const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { message, type, position = "top" } = toast
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(position === "top" ? -100 : 100)).current

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    // Animate out before unmounting
    return () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: position === "top" ? -100 : 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [])

  // Get background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "info":
      default:
        return "bg-blue-500"
    }
  }

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓"
      case "error":
        return "✕"
      case "warning":
        return "⚠"
      case "info":
      default:
        return "ℹ"
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          ...(position === "top" ? styles.top : styles.bottom),
        },
      ]}
      className={`mx-4 rounded-lg shadow-lg ${getBackgroundColor()} p-4 flex-row items-center justify-between`}
    >
      <View className="flex-row items-center flex-1">
        <Text className="text-white font-bold mr-2">{getIcon()}</Text>
        <Text className="text-white flex-1">{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} className="ml-2">
        X
      </TouchableOpacity>
    </Animated.View>
  )
}

// Styles
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  top: {
    top: 50,
  },
  bottom: {
    bottom: 50,
  },
})

// Custom hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}
