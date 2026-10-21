using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace CCAInputInjector
{
    class Program
    {
        [DllImport("user32.dll")]
        static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        static extern bool IsWindowVisible(IntPtr hWnd);

        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
        private const uint MOUSEEVENTF_WHEEL = 0x0800;

        private const uint KEYEVENTF_KEYUP = 0x0002;

        static string lastActiveProc = "";
        static string lastActiveTitle = "";

        static void Main(string[] args)
        {
            // Start background active window tracking thread
            StartActiveWindowTracker();

            string line;
            while ((line = Console.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                try
                {
                    string[] parts = line.Trim().Split(' ');
                    string cmd = parts[0].ToUpper();

                    switch (cmd)
                    {
                        case "M": // Move: M x y
                            if (parts.Length >= 3)
                            {
                                int x = int.Parse(parts[1]);
                                int y = int.Parse(parts[2]);
                                SetCursorPos(x, y);
                            }
                            break;

                        case "LD": // Left Down: LD [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            break;

                        case "LU": // Left Up: LU [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                            break;

                        case "RD": // Right Down: RD [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                            break;

                        case "RU": // Right Up: RU [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                            break;

                        case "C": // Click: C [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                            break;

                        case "RC": // Right Click: RC [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                            break;

                        case "DC": // Double Click: DC [x y]
                            if (parts.Length >= 3) SetCursorPos(int.Parse(parts[1]), int.Parse(parts[2]));
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                            break;

                        case "W": // Wheel: W delta
                            if (parts.Length >= 2)
                            {
                                int delta = int.Parse(parts[1]);
                                mouse_event(MOUSEEVENTF_WHEEL, 0, 0, (uint)delta, 0);
                            }
                            break;

                        case "KD": // Key Down: KD vkCode
                            if (parts.Length >= 2)
                            {
                                byte vk = byte.Parse(parts[1]);
                                keybd_event(vk, 0, 0, 0);
                            }
                            break;

                        case "KU": // Key Up: KU vkCode
                            if (parts.Length >= 2)
                            {
                                byte vk = byte.Parse(parts[1]);
                                keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
                            }
                            break;

                        case "T": // Type text: T message
                            if (parts.Length >= 2)
                            {
                                string text = line.Substring(2);
                                SendKeys.SendWait(text);
                            }
                            break;

                        case "GAW": // Get Active Window
                            Console.WriteLine("ACTIVE_WINDOW:" + GetActiveWindowJson());
                            Console.Out.Flush();
                            break;

                        case "APPS": // Get Running Apps List
                            Console.WriteLine("RUNNING_APPS:" + GetRunningAppsJson());
                            Console.Out.Flush();
                            break;

                        case "PING":
                            Console.WriteLine("PONG");
                            Console.Out.Flush();
                            break;

                        case "QUIT":
                            return;
                    }
                }
                catch (Exception)
                {
                    // Ignore transient malformed packet
                }
            }
        }

        static void StartActiveWindowTracker()
        {
            Thread t = new Thread(new ThreadStart(ActiveWindowLoop));
            t.IsBackground = true;
            t.Start();
        }

        static void ActiveWindowLoop()
        {
            while (true)
            {
                try
                {
                    IntPtr hWnd = GetForegroundWindow();
                    if (hWnd != IntPtr.Zero)
                    {
                        uint pid = 0;
                        GetWindowThreadProcessId(hWnd, out pid);

                        string procName = "";
                        try
                        {
                            Process p = Process.GetProcessById((int)pid);
                            procName = p.ProcessName;
                        }
                        catch {}

                        StringBuilder sb = new StringBuilder(512);
                        GetWindowText(hWnd, sb, 512);
                        string title = sb.ToString().Trim();

                        if (!string.IsNullOrEmpty(procName) && (procName != lastActiveProc || title != lastActiveTitle))
                        {
                            lastActiveProc = procName;
                            lastActiveTitle = title;

                            string json = "{\"process\":\"" + EscapeJson(procName) + "\",\"title\":\"" + EscapeJson(title) + "\",\"pid\":" + pid + "}";
                            Console.WriteLine("ACTIVE_WINDOW:" + json);
                            Console.Out.Flush();
                        }
                    }
                }
                catch {}
                Thread.Sleep(1500); // Check every 1.5 seconds
            }
        }

        static string GetActiveWindowJson()
        {
            try
            {
                IntPtr hWnd = GetForegroundWindow();
                if (hWnd == IntPtr.Zero) return "{\"process\":\"\",\"title\":\"\",\"pid\":0}";

                uint pid = 0;
                GetWindowThreadProcessId(hWnd, out pid);

                string procName = "";
                try
                {
                    Process p = Process.GetProcessById((int)pid);
                    procName = p.ProcessName;
                }
                catch {}

                StringBuilder sb = new StringBuilder(512);
                GetWindowText(hWnd, sb, 512);
                string title = sb.ToString().Trim();

                return "{\"process\":\"" + EscapeJson(procName) + "\",\"title\":\"" + EscapeJson(title) + "\",\"pid\":" + pid + "}";
            }
            catch (Exception ex)
            {
                return "{\"process\":\"\",\"title\":\"\",\"error\":\"" + EscapeJson(ex.Message) + "\"}";
            }
        }

        static string GetRunningAppsJson()
        {
            try
            {
                List<string> appList = new List<string>();
                Process[] processes = Process.GetProcesses();
                foreach (Process p in processes)
                {
                    try
                    {
                        if (p.MainWindowHandle != IntPtr.Zero && !string.IsNullOrEmpty(p.MainWindowTitle))
                        {
                            string item = "{\"process\":\"" + EscapeJson(p.ProcessName) + "\",\"title\":\"" + EscapeJson(p.MainWindowTitle.Trim()) + "\"}";
                            appList.Add(item);
                        }
                    }
                    catch {}
                }
                return "[" + string.Join(",", appList.ToArray()) + "]";
            }
            catch (Exception)
            {
                return "[]";
            }
        }

        static string EscapeJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
        }
    }
}
