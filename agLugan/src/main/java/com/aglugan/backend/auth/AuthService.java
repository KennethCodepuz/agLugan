package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.ResultDTO;
import com.aglugan.backend.entity.User;
import com.aglugan.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.aglugan.backend.auth.googleAuth.GoogleTokenVerifier;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class AuthService {

    private final GoogleTokenVerifier verifier;
    private final UserService userService;

    @Autowired
    public AuthService(GoogleTokenVerifier verifier, UserService user, UserService userService) {
        this.verifier = verifier;
        this.userService = userService;
    }

    public ResultDTO registerUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

        if(user.isGoogleUserSuccess() || user.getGoogleUser() == null) {
            return user;
        }

//        Check if User is already registered
        Optional<User> userGoogleSub = userService.getUserByGoogleSub(user.getGoogleUser().getId());
        if(userGoogleSub.isPresent()) {
            ResultDTO result = ResultDTO.errorMessage("User already registered");
            return result;
        }

//        Store to database
        User newUser = new User(user.getUser().getGoogleSub(), user.getUser().getName(), user.getUser().getEmail(), null ,user.getUser().getProfilePicture());
        userService.createUser(newUser);

        return user;
    }



    public ResultDTO loginUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

//        Check database for user
        Optional<User> userGoogleSub = userService.getUserByGoogleSub(user.getGoogleUser().getId());

        if(userGoogleSub.isPresent()) {
            User userData = userGoogleSub.get();
            ResultDTO result = ResultDTO.userSuccess(userData);
            return  result;
        }else {
            System.out.println("User not found");
            ResultDTO result = ResultDTO.errorMessage("User is not registered");
            return  result;
        }
    }

}
