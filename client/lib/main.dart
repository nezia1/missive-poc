import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'auth_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  final title = 'Flutter Auth';
  const MyApp({super.key});

  // This widget is the root of your application
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: title,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: title),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  String? _name;
  String? _password;
  String? _totp;

  // UI state
  bool _incompleteCredentials = false,
      _invalidCredentials = false,
      _totpRequired = false,
      _totpInvalid = false;

  Future<void> handleLogin() async {
    // key-value storage for sensitive data
    const secureStorage = FlutterSecureStorage();
    // regular key-value storage
    final prefs = await SharedPreferences.getInstance();

    // state variables
    if (_name == null || _password == null) {
      _incompleteCredentials = true;
      return;
    }

    // forcing the value to be non-null because we've already checked for null (also type promotion does not work when variable is non final)
    final loginResult = await AuthService.login(_name!, _password!, _totp);

    if (loginResult is LoginSuccess) {
      // store tokens
      await secureStorage.write(
          key: 'refreshToken', value: loginResult.refreshToken);
      await prefs.setString('accessToken', loginResult.accessToken);
      // TODO implement page navigation after successful login
    }

    if (loginResult is LoginFailure) {
      switch (loginResult.status) {
        case AuthStatus.totpRequired:
          setState(() => _totpRequired = true);
          break;
        case AuthStatus.invalidCredentials:
          setState(() => _invalidCredentials = true);
          break;
        case AuthStatus.totpInvalid:
          setState(() => _totpInvalid = true);
          break;
        // TODO handle error (and send it from the function)
        case AuthStatus.error:
          break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      appBar: AppBar(
        // TRY THIS: Try changing the color here to a specific color (to
        // Colors.amber, perhaps?) and trigger a hot reload to see the AppBar
        // change color while the other colors stay the same.
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Padding(
          padding: const EdgeInsets.only(left: 80.0, right: 80.0),
          child: Column(
            // Column is also a layout widget. It takes a list of children and
            // arranges them vertically. By default, it sizes itself to fit its
            // children horizontally, and tries to be as tall as its parent.
            //
            // Column has various properties to control how it sizes itself and
            // how it positions its children. Here we use mainAxisAlignment to
            // center the children vertically; the main axis here is the vertical
            // axis because Columns are vertical (the cross axis would be
            // horizontal).
            //
            // TRY THIS: Invoke "debug painting" (choose the "Toggle Debug Paint"
            // action in the IDE, or press "p" in the console), to see the
            // wireframe for each widget.
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              TextField(
                  style: Theme.of(context).textTheme.bodyMedium,
                  decoration: const InputDecoration(labelText: 'Name'),
                  onChanged: (value) => _name = value),
              TextField(
                style: Theme.of(context).textTheme.bodyMedium,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                onChanged: (value) => _password = value,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                  child: const Text('Login'),
                  onPressed: () async {
                    await handleLogin();
                    if (_totpRequired) {
                      if (!context.mounted) return;
                      // TODO show TOTP modal from new widget
                      showModalBottomSheet(
                          context: context,
                          builder: (BuildContext context) {
                            return const Placeholder();
                          });
                    }
                  }),
              if (_invalidCredentials) const Text('Invalid Credentials'),
              if (_incompleteCredentials) const Text('Incomplete Credentials')
            ],
          ),
        ),
      ),
    );
  }
}
